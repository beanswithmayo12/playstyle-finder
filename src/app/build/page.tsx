import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { type MetricVector, type PositionGroup } from "@/lib/metrics";
import { BuildEditor } from "@/components/build-editor";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/quiz");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      profile: true,
      build: true,
      assessments: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  // The builder needs a position and a "you today" baseline → quiz first.
  if (!user?.profile || !user.assessments[0]?.metrics) redirect("/quiz");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-sm font-semibold text-zinc-300">
          ← Your match
        </Link>
        <span className="text-sm text-zinc-500">⚽ Playstyle Finder</span>
      </header>
      <div className="mx-auto max-w-3xl px-6 pb-24">
        <BuildEditor
          position={user.profile.positionGroup as PositionGroup}
          quizMetrics={user.assessments[0].metrics as MetricVector}
          savedBuild={(user.build?.metrics as MetricVector | undefined) ?? null}
        />
      </div>
    </main>
  );
}
