import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { METRIC_KEYS, type MetricVector, type PositionGroup } from "@/lib/metrics";
import { bestPositions, displayMatchPercent } from "@/lib/matching";
import { loadProCandidates } from "@/lib/pros";
import { loadFilmBreakdown } from "@/lib/film";
import { statLine } from "@/lib/film-stats";
import { FOOT_OPTIONS, LEVEL_OPTIONS, POSITION_OPTIONS } from "@/data/quiz";
import { METRIC_LABELS } from "@/components/metric-labels";
import { FilmBreakdown } from "@/components/film-breakdown";

export const dynamic = "force-dynamic";

// Profiles belong to (often underage) athletes: shared by link, never indexed.
export const metadata: Metadata = {
  title: "Player profile — Playstyle Finder",
  robots: { index: false, follow: false },
};

const label = (opts: { value: string; label: string }[], v?: string | null) =>
  opts.find((o) => o.value === v)?.label ?? null;

function feetInches(cm: number): string {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await prisma.recruitingProfile.findUnique({
    where: { slug },
    include: {
      user: {
        include: {
          profile: true,
          assessments: {
            where: { status: "COMPLETE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { match: { include: { proPlayer: true } } },
          },
        },
      },
    },
  });
  if (!profile) notFound();

  const { userId: clerkId } = await auth();
  const isOwner = clerkId === profile.user.clerkId;
  if (!profile.published && !isOwner) notFound();

  const athlete = profile.user.profile;
  const assessment = profile.user.assessments[0];
  const match = assessment?.match;
  const metrics = (assessment?.metrics as MetricVector | null) ?? null;
  const filmVerified = !!assessment && assessment.inputType !== "QUESTIONNAIRE";

  const fits =
    metrics && athlete
      ? bestPositions(metrics, athlete.positionGroup as PositionGroup, await loadProCandidates())
      : [];
  const film = profile.featuredAssessmentId
    ? await loadFilmBreakdown(profile.userId, profile.featuredAssessmentId)
    : null;

  const facts = [
    label(POSITION_OPTIONS, athlete?.positionGroup),
    profile.gradYear ? `Class of ${profile.gradYear}` : null,
    athlete?.preferredFoot === "BOTH"
      ? "Two-footed"
      : athlete?.preferredFoot
        ? `${label(FOOT_OPTIONS, athlete.preferredFoot)} foot`
        : null,
    profile.heightCm ? `${feetInches(profile.heightCm)} (${profile.heightCm} cm)` : null,
    label(LEVEL_OPTIONS, athlete?.playingLevel),
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {!profile.published && (
        <div className="bg-amber-500/15 px-6 py-3 text-center text-sm text-amber-200">
          Preview — only you can see this.{" "}
          <Link href="/profile" className="font-semibold underline">
            Publish it
          </Link>{" "}
          to share the link with coaches.
        </div>
      )}
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        {/* Identity */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Player profile</p>
          <h1 className="mt-2 text-4xl font-black">{athlete?.displayName ?? "Player"}</h1>
          <p className="mt-2 text-zinc-300">{facts.join(" · ")}</p>
          {(profile.team || profile.location) && (
            <p className="mt-1 text-zinc-500">
              {[profile.team, profile.location].filter(Boolean).join(" · ")}
            </p>
          )}
          {match && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm">
                Plays like <span className="font-bold text-emerald-400">{match.proPlayer.knownAs}</span>{" "}
                · {displayMatchPercent(match.similarity)}%
              </span>
              <span className="text-sm text-zinc-400">{match.proPlayer.archetype}</span>
            </div>
          )}
          {profile.contactEmail && (
            <a
              href={`mailto:${profile.contactEmail}`}
              className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Contact
            </a>
          )}
        </section>

        {profile.bio && (
          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold">About</h2>
            <p className="whitespace-pre-line leading-relaxed text-zinc-300">{profile.bio}</p>
          </section>
        )}

        {fits.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Best-fit positions</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {fits.map((f) => (
                <div key={f.position} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="font-semibold">{label(POSITION_OPTIONS, f.position)}</p>
                  <p className="text-2xl font-black text-emerald-400">{f.matchPercent}%</p>
                  <p className="text-xs text-zinc-500">closest pro: {f.closestPro}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {metrics && (
          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Attribute ratings</h2>
              <span className={`text-xs ${filmVerified ? "text-sky-400" : "text-zinc-500"}`}>
                {filmVerified ? "🎬 Verified by film" : "Self-reported (questionnaire)"}
              </span>
            </div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {METRIC_KEYS.map((k) => (
                <div key={k}>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{METRIC_LABELS[k]}</span>
                    <span className="font-semibold">{metrics[k]}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-800">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${metrics[k]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {film && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">Highlight film</h2>
            {film.stats.length > 0 && <p className="mb-4 mt-1 text-sm text-zinc-400">{statLine(film.stats)}</p>}
            <FilmBreakdown stats={film.stats} moments={film.moments} videoUrl={film.videoUrl} />
          </section>
        )}

        <footer className="mt-12 border-t border-zinc-900 pt-6 text-center text-xs text-zinc-600">
          Ratings are AI estimates from game film and a player questionnaire — a starting point
          for scouting, not an official evaluation.
          <div className="mt-4">
            <Link href="/" className="text-zinc-400 underline hover:text-zinc-200">
              Find which pro you play like — free
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
