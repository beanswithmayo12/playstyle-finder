/**
 * PUT /api/local-upload?key=... — development-only upload target used when
 * R2 is not configured (see src/lib/storage.ts). Stores the video under
 * .uploads/ in the project. The key must belong to the signed-in user.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { storageMode, writeLocalVideo } from "@/lib/storage";

const MAX_BYTES = 250 * 1024 * 1024;

export async function PUT(req: NextRequest) {
  if (storageMode() !== "local") {
    return NextResponse.json({ error: "local uploads are disabled" }, { status: 404 });
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "unknown user" }, { status: 400 });

  const key = req.nextUrl.searchParams.get("key");
  if (!key?.startsWith(`reels/${user.id}/`)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }

  const data = Buffer.from(await req.arrayBuffer());
  if (data.length === 0 || data.length > MAX_BYTES) {
    return NextResponse.json({ error: "video must be 1 byte – 250 MB" }, { status: 400 });
  }
  // Next.js silently truncates oversized bodies unless configured — refuse a
  // partial file rather than analyzing corrupt video.
  const declared = Number(req.headers.get("content-length") ?? data.length);
  if (declared && declared !== data.length) {
    return NextResponse.json(
      { error: "upload was truncated — restart the dev server so the raised body-size limit applies" },
      { status: 400 },
    );
  }

  await writeLocalVideo(key, data);
  return NextResponse.json({ stored: true });
}
