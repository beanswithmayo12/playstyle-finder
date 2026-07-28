/**
 * POST /api/progress — toggle a session's completion for the signed-in user.
 * Body: { sessionId: string }. Verifies plan access before writing.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { userHasPlanAccess } from "@/lib/access";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 400 });

  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const session = await prisma.planSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "session not found" }, { status: 404 });

  if (!(await userHasPlanAccess(user.id, session.planId))) {
    return NextResponse.json({ error: "no access to this plan" }, { status: 403 });
  }

  const existing = await prisma.sessionCompletion.findUnique({
    where: { userId_sessionId: { userId: user.id, sessionId } },
  });

  if (existing) {
    await prisma.sessionCompletion.delete({ where: { id: existing.id } });
    return NextResponse.json({ completed: false });
  }
  await prisma.sessionCompletion.create({ data: { userId: user.id, sessionId } });
  return NextResponse.json({ completed: true });
}
