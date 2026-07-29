/**
 * POST /api/analyze/video — kick off the background video analysis.
 * Body: { videoKey, jerseyColor, jerseyNumber }
 * Requires an existing profile (position comes from it) — the upload page
 * sends athletes without one through the quiz first.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId }, include: { profile: true } });
  if (!user?.profile) {
    return NextResponse.json({ error: "complete the questionnaire first" }, { status: 400 });
  }

  const { videoKey, jerseyColor, jerseyNumber } = (await req.json()) as {
    videoKey?: string;
    jerseyColor?: string;
    jerseyNumber?: string;
  };
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

  await inngest.send({
    name: "video/analysis.requested",
    data: {
      assessmentId: assessment.id,
      userId: user.id,
      videoKey,
      positionGroup: user.profile.positionGroup,
      jerseyColor: jerseyColor.trim(),
      jerseyNumber: jerseyNumber.trim(),
    },
  });

  return NextResponse.json({ assessmentId: assessment.id });
}
