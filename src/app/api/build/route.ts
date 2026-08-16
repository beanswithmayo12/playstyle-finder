/**
 * POST /api/build — save the athlete's 2K-style dream build and return the
 * pros most similar to it. Body: { metrics: MetricVector }
 * Position comes from the athlete's profile (set by the quiz).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { type MetricVector, type PositionGroup } from "@/lib/metrics";
import { buildOverall, validateBuild } from "@/lib/build";
import { displayMatchPercent, rankMatches, type ProCandidate } from "@/lib/matching";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId }, include: { profile: true } });
  if (!user?.profile) {
    return NextResponse.json({ error: "take the quiz first" }, { status: 400 });
  }

  const { metrics } = (await req.json()) as { metrics?: MetricVector };
  const valid = validateBuild(metrics);
  if (!valid.ok) return NextResponse.json({ error: valid.reason }, { status: 400 });

  const position = user.profile.positionGroup as PositionGroup;
  const overall = buildOverall(metrics!, position);

  await prisma.playerBuild.upsert({
    where: { userId: user.id },
    create: { userId: user.id, positionGroup: position, metrics: metrics!, overall },
    update: { positionGroup: position, metrics: metrics!, overall },
  });

  const pros = await prisma.proPlayer.findMany({ where: { active: true } });
  const candidates: ProCandidate[] = pros.map((p) => ({
    id: p.id,
    slug: p.slug,
    knownAs: p.knownAs,
    positionGroup: p.positionGroup as PositionGroup,
    metrics: p.metrics as ProCandidate["metrics"],
  }));
  const ranked = rankMatches(metrics!, position, candidates);

  return NextResponse.json({
    overall,
    matches: ranked.map((r) => {
      const pro = pros.find((p) => p.id === r.pro.id)!;
      return {
        knownAs: pro.knownAs,
        archetype: pro.archetype,
        tagline: pro.tagline,
        matchPercent: displayMatchPercent(r.similarity),
      };
    }),
  });
}
