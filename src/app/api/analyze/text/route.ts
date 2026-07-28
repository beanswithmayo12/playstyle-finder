/**
 * POST /api/analyze/text — questionnaire analysis, synchronous.
 *
 * Body: QuizAnswers (src/data/quiz.ts) — profile fields + tactical answers.
 * Flow: upsert user/profile → Claude scores metrics → match against pro
 * roster → Claude writes explanation → persist Assessment + MatchResult.
 * The user row is upserted from the Clerk session here so the funnel never
 * depends on webhook delivery timing.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { isCompleteVector, type PositionGroup } from "@/lib/metrics";
import { rankMatches, displayMatchPercent, type ProCandidate } from "@/lib/matching";
import { MATCH_EXPLAINER_SYSTEM, PROMPT_VERSION } from "@/lib/prompts";
import { analyzeQuestionnaire } from "@/lib/ai/questionnaire";
import type { QuizAnswers } from "@/data/quiz";
import type { Foot, PlayingLevel } from "@/generated/prisma/enums";

const anthropic = new Anthropic();

const POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];
const FEET = ["LEFT", "RIGHT", "BOTH"];
const LEVELS = ["YOUTH", "HIGH_SCHOOL", "ACADEMY", "COLLEGE", "SEMI_PRO", "ADULT_AMATEUR"];

export async function POST(req: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as QuizAnswers;
  if (
    !POSITIONS.includes(body.positionGroup) ||
    !FEET.includes(body.preferredFoot) ||
    !LEVELS.includes(body.playingLevel) ||
    !Array.isArray(body.tactical) ||
    body.tactical.length === 0
  ) {
    return NextResponse.json({ error: "invalid quiz payload" }, { status: 400 });
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (!email) return NextResponse.json({ error: "no email on account" }, { status: 400 });

  const displayName =
    clerkUser.firstName ?? clerkUser.username ?? email.split("@")[0];

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: { clerkId: clerkUser.id, email },
    update: { email },
  });

  await prisma.athleteProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName,
      positionGroup: body.positionGroup as PositionGroup,
      preferredFoot: body.preferredFoot as Foot,
      playingLevel: body.playingLevel as PlayingLevel,
    },
    update: {
      positionGroup: body.positionGroup as PositionGroup,
      preferredFoot: body.preferredFoot as Foot,
      playingLevel: body.playingLevel as PlayingLevel,
    },
  });

  // 1. Score the questionnaire into the canonical metric vector.
  const scored = await analyzeQuestionnaire({
    position: body.positionGroup,
    preferredFoot: body.preferredFoot,
    playingLevel: body.playingLevel,
    answers: body.tactical.map((t) => ({ question: t.question, answer: t.answer })),
  });
  if (!isCompleteVector(scored.metrics)) {
    return NextResponse.json({ error: "analysis failed, please retry" }, { status: 502 });
  }

  // 2. Match against the active pro roster (in-memory; roster is small).
  const pros = await prisma.proPlayer.findMany({ where: { active: true } });
  const candidates: ProCandidate[] = pros.map((p) => ({
    id: p.id,
    slug: p.slug,
    knownAs: p.knownAs,
    positionGroup: p.positionGroup as PositionGroup,
    metrics: p.metrics as ProCandidate["metrics"],
  }));

  const ranked = rankMatches(scored.metrics, body.positionGroup as PositionGroup, candidates);
  if (ranked.length === 0) {
    return NextResponse.json({ error: "no candidates — is the roster seeded?" }, { status: 500 });
  }
  const best = ranked[0];
  const bestPro = pros.find((p) => p.id === best.pro.id)!;

  // 3. Generate the tactical explanation, grounded in the numbers only.
  const explanation = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    system: MATCH_EXPLAINER_SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          athlete: { metrics: scored.metrics, scoutNotes: scored.scoutNotes },
          pro: {
            knownAs: bestPro.knownAs,
            archetype: bestPro.archetype,
            styleSummary: bestPro.styleSummary,
            metrics: bestPro.metrics,
          },
          deltas: best.deltas,
          runnersUp: ranked.slice(1).map((r) => r.pro.knownAs),
        }),
      },
    ],
  });
  const explanationText = explanation.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // 4. Persist assessment + match.
  const assessment = await prisma.assessment.create({
    data: {
      userId: user.id,
      inputType: "QUESTIONNAIRE",
      status: "COMPLETE",
      rawAnswers: body as never,
      metrics: scored.metrics,
      confidence: scored.confidence,
      modelInfo: { model: "claude-sonnet-5", promptVersion: PROMPT_VERSION },
      completedAt: new Date(),
      match: {
        create: {
          proPlayerId: best.pro.id,
          similarity: best.similarity,
          explanation: explanationText,
          runnersUp: ranked.slice(1).map((r) => ({
            proPlayerId: r.pro.id,
            similarity: r.similarity,
          })),
          metricDeltas: best.deltas,
        },
      },
    },
    include: { match: true },
  });

  return NextResponse.json({
    assessmentId: assessment.id,
    match: {
      pro: { slug: bestPro.slug, knownAs: bestPro.knownAs, archetype: bestPro.archetype },
      matchPercent: displayMatchPercent(best.similarity),
      explanation: explanationText,
    },
  });
}
