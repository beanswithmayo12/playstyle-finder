/**
 * GET /api/local-video?key=... — dev-only playback for reels stored under
 * .uploads/ (see src/lib/storage.ts). Supports HTTP Range requests, which
 * browsers require to seek within a <video>. Serves a reel to its owner, or
 * to anyone when it is featured on a published recruiting profile.
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { localVideoPath, storageMode } from "@/lib/storage";

const TYPES: Record<string, string> = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };

export async function GET(req: NextRequest) {
  if (storageMode() !== "local") return new NextResponse(null, { status: 404 });

  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!(await canView(key))) return new NextResponse(null, { status: 404 });

  let file: string;
  let size: number;
  try {
    file = localVideoPath(key);
    size = (await stat(file)).size;
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const type = TYPES[key.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (!range) {
    const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
    return new NextResponse(body, {
      headers: { "Content-Type": type, "Content-Length": String(size), "Accept-Ranges": "bytes" },
    });
  }

  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
  if (start >= size || start > end) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
  return new NextResponse(body, {
    status: 206,
    headers: {
      "Content-Type": type,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    },
  });
}

async function canView(key: string): Promise<boolean> {
  if (!key.startsWith("reels/")) return false;

  const { userId: clerkId } = await auth();
  if (clerkId) {
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (user && key.startsWith(`reels/${user.id}/`)) return true;
  }

  const featured = await prisma.assessment.findFirst({
    where: { videoKey: key },
    select: { id: true, user: { select: { recruiting: true } } },
  });
  const profile = featured?.user.recruiting;
  return !!profile?.published && profile.featuredAssessmentId === featured?.id;
}
