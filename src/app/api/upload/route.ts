/**
 * POST /api/upload — mint a presigned R2 PUT URL for a highlight reel.
 * Body: { contentType: string, sizeBytes: number }
 * Guardrails: signed-in only, mp4/mov/webm, 250 MB cap, 3 analyses / 30 days.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { presignVideoUpload } from "@/lib/r2";

const MAX_BYTES = 250 * 1024 * 1024;
const ALLOWED = ["video/mp4", "video/quicktime", "video/webm"];
const MONTHLY_QUOTA = 3;

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "take the quiz first" }, { status: 400 });

  const { contentType, sizeBytes } = (await req.json()) as {
    contentType?: string;
    sizeBytes?: number;
  };
  if (!contentType || !ALLOWED.includes(contentType)) {
    return NextResponse.json({ error: "upload an mp4, mov, or webm video" }, { status: 400 });
  }
  if (!sizeBytes || sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "video must be under 250 MB (≈3 minutes)" }, { status: 400 });
  }

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const recent = await prisma.assessment.count({
    where: { userId: user.id, inputType: { in: ["VIDEO", "HYBRID"] }, createdAt: { gte: since } },
  });
  if (recent >= MONTHLY_QUOTA) {
    return NextResponse.json(
      { error: "video analysis limit reached — try again next month" },
      { status: 429 },
    );
  }

  const ext = contentType === "video/webm" ? "webm" : contentType === "video/quicktime" ? "mov" : "mp4";
  const key = `reels/${user.id}/${randomUUID()}.${ext}`;
  const uploadUrl = await presignVideoUpload(key, contentType);

  return NextResponse.json({ uploadUrl, videoKey: key });
}
