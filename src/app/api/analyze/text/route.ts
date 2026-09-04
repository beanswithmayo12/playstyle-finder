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
import { prisma } from "@/lib/db";
import { isCompleteVector, type PositionGroup } from "@/lib/metrics";
import { PROMPT_VERSION } from "@/lib/prompts";
import { analyzeQuestionnaire } from "@/lib/ai/questionnaire";
import { completeAssessment } from "@/lib/analysis";
import type { QuizAnswers } from "@/data/quiz";
import type { Foot, PlayingLevel } from "@/generated/prisma/enums";

const POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];
const FEET = ["LEFT", "RIGHT", "BOTH"];
const LEVELS = ["YOUTH", "HIGH_SCHOOL", "ACADEMY", "COLLEGE", "SEMI_PRO", "ADULT_AMATEUR"];

export async function POST(req: NextRequest) {
  try {
    return await handleAnalyze(req);
  } catch (e) {
    // Surface the underlying cause (bad API key, unreachable DB, empty
    // roster...) to the client instead of an opaque 500 page.
    console.error("analyze/text failed:", e);
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleAnalyze(req: NextRequest) {
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

  // 2. Persist the assessment shell, then run the shared match pipeline.
  const assessment = await prisma.assessment.create({
    data: {
      userId: user.id,
      inputType: "QUESTIONNAIRE",
      status: "PROCESSING",
      rawAnswers: body as never,
      modelInfo: { model: "claude-sonnet-5", promptVersion: PROMPT_VERSION },
    },
  });

  const outcome = await completeAssessment({
    assessmentId: assessment.id,
    position: body.positionGroup as PositionGroup,
    metrics: scored.metrics,
    confidence: scored.confidence,
    scoutNotes: scored.scoutNotes,
  });

  return NextResponse.json({
    assessmentId: assessment.id,
    match: {
      pro: { slug: outcome.proSlug, knownAs: outcome.proKnownAs, archetype: outcome.archetype },
      matchPercent: outcome.matchPercent,
      explanation: outcome.explanation,
    },
  });
}
