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
import { SiteHeader } from "@/components/site-header";

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
    <>
      <SiteHeader width="max-w-3xl" />
      <main className="min-h-screen text-ink">
        {!profile.published && (
          <div className="bg-warn/10 px-6 py-3 text-center text-sm text-warn">
            Preview — only you can see this.{" "}
            <Link href="/profile" className="font-semibold underline">
              Publish it
            </Link>{" "}
            to share the link with coaches.
          </div>
        )}
        <div className="mx-auto max-w-3xl px-6 pb-24 pt-10">
          {/* Identity */}
          <section className="rounded-3xl border border-rule bg-surface p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest text-soft">Player profile</p>
            <h1 className="mt-2 text-4xl display">{athlete?.displayName ?? "Player"}</h1>
            <p className="mt-2 text-ink-2">{facts.join(" · ")}</p>
            {(profile.team || profile.location) && (
              <p className="mt-1 text-soft">
                {[profile.team, profile.location].filter(Boolean).join(" · ")}
              </p>
            )}
            {match && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cobalt/40 bg-cobalt/10 px-4 py-2 text-sm">
                  Plays like <span className="font-bold text-cobalt">{match.proPlayer.knownAs}</span>{" "}
                  · {displayMatchPercent(match.similarity)}%
                </span>
                <span className="text-sm text-soft">{match.proPlayer.archetype}</span>
              </div>
            )}
            {profile.contactEmail && (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="mt-6 inline-block rounded-lg bg-cobalt px-6 py-3 font-semibold text-on-cobalt transition hover:bg-cobalt-hover"
              >
                Contact
              </a>
            )}
          </section>

          {profile.bio && (
            <section className="mt-8">
              <h2 className="mb-2 text-lg font-bold">About</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink-2">{profile.bio}</p>
            </section>
          )}

          {fits.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Best-fit positions</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {fits.map((f) => (
                  <div key={f.position} className="rounded-xl border border-rule bg-surface p-4">
                    <p className="font-semibold">{label(POSITION_OPTIONS, f.position)}</p>
                    <p className="text-2xl display text-cobalt">{f.matchPercent}%</p>
                    <p className="text-xs text-soft">closest pro: {f.closestPro}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {metrics && (
            <section className="mt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-bold">Attribute ratings</h2>
                <span className={`text-xs ${filmVerified ? "text-cobalt" : "text-soft"}`}>
                  {filmVerified ? "Verified by film" : "Self-reported (questionnaire)"}
                </span>
              </div>
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {METRIC_KEYS.map((k) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-2">{METRIC_LABELS[k]}</span>
                      <span className="font-semibold">{metrics[k]}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-track">
                      <div className="h-2 rounded-full bg-cobalt" style={{ width: `${metrics[k]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {film && (
            <section className="mt-10">
              <h2 className="text-lg font-bold">Highlight film</h2>
              {film.stats.length > 0 && <p className="mb-4 mt-1 text-sm text-soft">{statLine(film.stats)}</p>}
              <FilmBreakdown stats={film.stats} moments={film.moments} videoUrl={film.videoUrl} />
            </section>
          )}

          <footer className="mt-12 border-t border-rule pt-6 text-center text-xs text-faint">
            Ratings are AI estimates from game film and a player questionnaire — a starting point
            for scouting, not an official evaluation.
            <div className="mt-4">
              <Link href="/" className="text-soft underline hover:text-cobalt">
                Find which pro you play like — free
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
