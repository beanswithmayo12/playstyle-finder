/**
 * POST /api/analyze/video — kick off the background video analysis.
 * Body: { videoKey, jerseyColor, jerseyNumber, positionGroup }
 * Film is a first-class entry point: the upload form supplies the position,
 * and the athlete profile is created here if the quiz was never taken.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest";
import { ensureUser } from "@/lib/users";
import type { PositionGroup } from "@/lib/metrics";

const POSITIONS = ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"];

export async function POST(req: NextRequest) {
  const session = await ensureUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { user, displayName } = session;

  const { videoKey, jerseyColor, jerseyNumber, positionGroup } = (await req.json()) as {
    videoKey?: string;
    jerseyColor?: string;
    jerseyNumber?: string;
    positionGroup?: string;
  };
  if (!positionGroup || !POSITIONS.includes(positionGroup)) {
    return NextResponse.json({ error: "pick the position you play" }, { status: 400 });
  }
  const profile = await prisma.athleteProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, displayName, positionGroup: positionGroup as PositionGroup },
    update: { positionGroup: positionGroup as PositionGroup },
  });
  if (!videoKey?.startsWith(`reels/${user.id}/`)) {
    return NextResponse.json({ error: "invalid video key" }, { status: 400 });
  }
  if (!jerseyColor?.trim() || !jerseyNumber?.trim()) {
    return NextResponse.json(
      { error: "jersey color and number are required so we can find you on film" },
      { status: 400 },
    );
  }

  const assessment = await prisma.assessment.create({
    data: {
      userId: user.id,
      inputType: "VIDEO",
      status: "PENDING",
      videoKey,
      videoMeta: { jerseyColor: jerseyColor.trim(), jerseyNumber: jerseyNumber.trim() },
    },
  });

  try {
    await inngest.send({
      name: "video/analysis.requested",
      data: {
        assessmentId: assessment.id,
        userId: user.id,
        videoKey,
        positionGroup: profile.positionGroup,
        jerseyColor: jerseyColor.trim(),
        jerseyNumber: jerseyNumber.trim(),
      },
    });
  } catch (e) {
    // Don't strand a PENDING shell (it would eat the user's quota).
    await prisma.assessment.delete({ where: { id: assessment.id } }).catch(() => {});
    const msg = e instanceof Error ? e.message : "could not queue analysis";
    return NextResponse.json(
      { error: `analysis queue unavailable — is the Inngest dev server running? (${msg.slice(0, 200)})` },
      { status: 503 },
    );
  }

  return NextResponse.json({ assessmentId: assessment.id });
}
