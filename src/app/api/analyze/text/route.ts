/**
 * POST /api/analyze/text — questionnaire analysis, synchronous.
 *
 * Flow: validate → Claude scores metrics → match against pro roster →
 * Claude writes explanation → persist Assessment + MatchResult → return match.
 * (Video analysis follows the same shape but runs inside an Inngest job;
 * see docs/01-architecture.md.)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { isCompleteVector, type PositionGroup } from "@/lib/metrics";
import { rankMatches, displayMatchPercent, type ProCandidate } from "@/lib/matching";
import { MATCH_EXPLAINER_SYSTEM, PROMPT_VERSION } from "@/lib/prompts";
import { analyzeQuestionnaire } from "@/lib/ai/questionnaire";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: { profile: true },
  });
  if (!user?.profile) {
    return NextResponse.json({ error: "complete your profile first" }, { status: 400 });
  }

  const rawAnswers = await req.json();

  // 1. Score the questionnaire into the canonical metric vector.
  const scored = await analyzeQuestionnaire(rawAnswers);
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

  const ranked = rankMatches(
    scored.metrics,
    user.profile.positionGroup as PositionGroup,
    candidates,
  );
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
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // 4. Persist assessment + match in one transaction.
  const assessment = await prisma.assessment.create({
    data: {
      userId: user.id,
      inputType: "QUESTIONNAIRE",
      status: "COMPLETE",
      rawAnswers,
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
