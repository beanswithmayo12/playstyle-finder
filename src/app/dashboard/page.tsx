import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { METRIC_KEYS, type MetricVector, type PositionGroup } from "@/lib/metrics";
import { buildOverall } from "@/lib/build";
import { buildHeatMap } from "@/lib/heatmap";
import { POSITION_OPTIONS } from "@/data/quiz";
import { signatureMetrics } from "@/components/report";
import { SiteHeader } from "@/components/site-header";
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
  const filmPanel =
    film && film.moments.length > 0
      ? { moments: film.moments, videoUrl: film.videoUrl, line: statLine(film.stats, 2) }
      : null;

  const position = (user.profile?.positionGroup ?? match.proPlayer.positionGroup) as PositionGroup;
  const positionLabel = POSITION_OPTIONS.find((o) => o.value === position)?.label ?? position;
  const reportDate = (assessment.completedAt ?? assessment.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const { reveal } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <SiteHeader />
      <MatchDashboard
        reveal={reveal === "1"}
        filmVerified={assessment.inputType !== "QUESTIONNAIRE"}
        filmProcessing={!!pendingVideo}
        athleteName={user.profile?.displayName ?? "Player"}
        positionLabel={positionLabel}
        reportDate={reportDate}
        athleteOvr={buildOverall(athleteMetrics, position)}
        proOvr={buildOverall(proMetrics, match.proPlayer.positionGroup as PositionGroup)}
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
        headToHeadKeys={signatureMetrics(position)}
        explanation={match.explanation}
        heat={buildHeatMap(position, user.profile?.preferredFoot ?? "RIGHT", athleteMetrics)}
        gaps={gaps}
        runnersUp={runnersUp}
        shareUrl={`${appUrl}/m/${match.id}`}
        film={filmPanel}
        practiceFocus={practiceFocus}
        recruiting={user.recruiting ?? null}
      />
    </>
  );
}

function FilmProcessing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <AutoRefresh />
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-rule border-t-cobalt" />
      <p className="label mt-6">Scouting in progress</p>
      <h1 className="display mt-3 text-3xl">Your film is being scouted…</h1>
      <p className="mt-3 max-w-sm text-soft">
        This page updates on its own — your match appears here as soon as the
        analysis finishes.
      </p>
    </main>
  );
}
