import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { userHasPlanAccess } from "@/lib/access";
import { ProgramView, type SessionData } from "@/components/program-view";

export const dynamic = "force-dynamic";

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/quiz");

  const { planId } = await params;
  const { purchase } = await searchParams;

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { clerkId } }),
    prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: {
        proPlayer: { select: { knownAs: true } },
        sessions: { orderBy: [{ week: "asc" }, { day: "asc" }] },
      },
    }),
  ]);
  if (!plan) notFound();

  const hasAccess = user ? await userHasPlanAccess(user.id, plan.id) : false;

  // Just paid but the webhook hasn't landed yet → friendly holding screen.
  if (!hasAccess && purchase === "success") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
        <h1 className="mt-6 text-2xl font-bold">Payment received — unlocking your program…</h1>
        <p className="mt-2 text-zinc-400">This usually takes a few seconds.</p>
        <a
          href={`/program/${plan.id}?purchase=success`}
          className="mt-6 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-emerald-500"
        >
          Refresh
        </a>
      </main>
    );
  }
  if (!hasAccess) redirect("/plans");

  const completions = await prisma.sessionCompletion.findMany({
    where: { userId: user!.id, session: { planId: plan.id } },
    select: { sessionId: true },
  });

  const sessions: SessionData[] = plan.sessions.map((s) => ({
    id: s.id,
    week: s.week,
    day: s.day,
    title: s.title,
    focus: s.focus,
    content: s.content as unknown as SessionData["content"],
    completed: completions.some((c) => c.sessionId === s.id),
  }));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300">
          ← Your match
        </Link>
        <span className="text-sm text-zinc-500">⚽ Playstyle Finder</span>
      </header>
      <div className="mx-auto max-w-3xl px-6 pb-24">
        <ProgramView
          title={plan.title}
          proName={plan.proPlayer.knownAs}
          weeks={plan.weeks}
          sessions={sessions}
          justPurchased={purchase === "success"}
        />
      </div>
    </main>
  );
}
