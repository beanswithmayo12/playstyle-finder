/** GET /api/assessments/[id] — poll analysis status (owner only). */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    select: { status: true, user: { select: { clerkId: true } } },
  });
  if (!assessment || assessment.user.clerkId !== clerkId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ status: assessment.status });
}
