import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { METRIC_KEYS, type MetricVector } from "@/lib/metrics";
import { displayMatchPercent } from "@/lib/matching";
import { METRIC_LABELS } from "@/components/metric-labels";
import { MatchDashboard, type StudyClip } from "@/components/match-dashboard";
import { AutoRefresh } from "@/components/auto-refresh";
import { loadFilmBreakdown } from "@/lib/film";
import { statLine } from "@/lib/film-stats";
import { weeklyPracticeFocus } from "@/data/practice-habits";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ reveal?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      profile: true,
      recruiting: { select: { slug: true, published: true } },
      assessments: {
        where: { status: "COMPLETE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { match: { include: { proPlayer: true } } },
      },
    },
  });

  if (!user) redirect("/");

  // A film analysis still running in the background? Ignore stale rows from
  // crashed runs (anything older than 30 min is dead, not running).
  const pendingVideo = await prisma.assessment.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PENDING", "PROCESSING"] },
      inputType: { in: ["VIDEO", "HYBRID"] },
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    select: { id: true },
  });

  const assessment = user.assessments[0];
  const match = assessment?.match;
  if (!assessment || !match) {
    // Film-first athletes have no match until their first reel finishes.
    if (pendingVideo) return <FilmProcessing />;
    redirect("/");
  }

  const athleteMetrics = assessment.metrics as MetricVector;
  const proMetrics = match.proPlayer.metrics as MetricVector;
  const deltas = match.metricDeltas as MetricVector;

  // Top 3 metrics where the pro is furthest ahead → the upsell bridge.
  const gaps = METRIC_KEYS.map((k) => ({ label: METRIC_LABELS[k], delta: deltas[k] }))
    .filter((g) => g.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  // Resolve runner-up names for the "shared DNA" strip.
  const runnerRefs = (match.runnersUp as { proPlayerId: string; similarity: number }[]) ?? [];
  const runnerPros = await prisma.proPlayer.findMany({
    where: { id: { in: runnerRefs.map((r) => r.proPlayerId) } },
    select: { id: true, knownAs: true },
  });
  const runnersUp = runnerRefs.flatMap((r) => {
    const pro = runnerPros.find((p) => p.id === r.proPlayerId);
    return pro ? [{ knownAs: pro.knownAs, matchPercent: displayMatchPercent(r.similarity) }] : [];
  });

  // Free team-practice card: habits for the biggest gaps vs the matched pro
  // (sorted by gap so there are always three, even for a near-perfect match).
  const practiceFocus = weeklyPracticeFocus(
    [...METRIC_KEYS].sort((a, b) => deltas[b] - deltas[a]),
  ).map(({ metric, habit }) => ({
    metricLabel: metric ? METRIC_LABELS[metric] : null,
    ...habit,
  }));

  const film = await loadFilmBreakdown(user.id);
  const filmSummary =
    film && film.moments.length > 0
      ? { line: statLine(film.stats), moments: film.moments.length }
      : null;

  const { reveal } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <MatchDashboard
      reveal={reveal === "1"}
      filmVerified={assessment.inputType !== "QUESTIONNAIRE"}
      filmProcessing={!!pendingVideo}
      athleteName={user.profile?.displayName ?? "Player"}
      matchPercent={displayMatchPercent(match.similarity)}
      pro={{
        knownAs: match.proPlayer.knownAs,
        archetype: match.proPlayer.archetype,
        tagline: match.proPlayer.tagline,
        styleSummary: match.proPlayer.styleSummary,
        studyClips: (match.proPlayer.studyClips as unknown as StudyClip[]) ?? [],
      }}
      athleteMetrics={athleteMetrics}
      proMetrics={proMetrics}
      explanation={match.explanation}
      gaps={gaps}
      runnersUp={runnersUp}
      shareUrl={`${appUrl}/m/${match.id}`}
      filmSummary={filmSummary}
      practiceFocus={practiceFocus}
      recruiting={user.recruiting ?? null}
    />
  );
}

function FilmProcessing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-50">
      <AutoRefresh />
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
      <h1 className="mt-6 text-2xl font-bold">Your film is being scouted…</h1>
      <p className="mt-2 max-w-sm text-zinc-400">
        This page updates on its own — your match appears here as soon as the
        analysis finishes.
      </p>
    </main>
  );
}
