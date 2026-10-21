"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MetricKey, MetricVector } from "@/lib/metrics";
import type { FilmMoment } from "@/lib/film-stats";
import { HeadToHead, Scoreboard } from "./report";
import { KeyMoments } from "./key-moments";

export interface StudyClip {
  title: string;
  youtubeQuery: string;
  focusPoint: string;
}

export interface MatchDashboardProps {
  reveal: boolean;
  filmVerified: boolean;
  filmProcessing: boolean;
  athleteName: string;
  positionLabel: string;
  reportDate: string;
  athleteOvr: number;
  proOvr: number;
  matchPercent: number;
  pro: {
    knownAs: string;
    archetype: string;
    tagline: string;
    styleSummary: string;
    studyClips: StudyClip[];
  };
  athleteMetrics: MetricVector;
  proMetrics: MetricVector;
  headToHeadKeys: MetricKey[];
  explanation: string;
  gaps: { label: string; delta: number }[];
  runnersUp: { knownAs: string; matchPercent: number }[];
  shareUrl: string;
  film: { moments: FilmMoment[]; videoUrl: string | null; line: string } | null;
  practiceFocus: { metricLabel: string | null; title: string; detail: string }[];
  recruiting: { slug: string; published: boolean } | null;
}

export function MatchDashboard(props: MatchDashboardProps) {
  const [revealed, setRevealed] = useState(!props.reveal);
  const [copied, setCopied] = useState(false);

  // The reveal moment: brief suspense beat, then the report fades in.
  useEffect(() => {
    if (!revealed) {
      const t = setTimeout(() => setRevealed(true), 900);
      return () => clearTimeout(t);
    }
  }, [revealed]);

  async function share() {
    const text = `Same game. Different stage. My playstyle is a ${props.matchPercent}% match with ${props.pro.knownAs}.`;
    if (navigator.share) {
      await navigator.share({ title: "Playstyle Finder", text, url: props.shareUrl }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text} ${props.shareUrl}`).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const topGap = props.gaps[0];

  return (
    <main className={`mx-auto max-w-6xl px-6 pb-24 transition-opacity duration-700 ${revealed ? "opacity-100" : "opacity-0"}`}>
      {/* Title row */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Your pro twin</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Player report</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-soft">
            {props.filmVerified ? "film-verified" : "self-reported"} · {props.reportDate}
          </span>
          <button onClick={share} className="btn-secondary px-4 py-2 text-sm">
            {copied ? "Link copied ✓" : "Share my match"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <Scoreboard
          athlete={{ name: props.athleteName, sub: props.positionLabel, ovr: props.athleteOvr }}
          pro={{ name: props.pro.knownAs, sub: props.pro.archetype, ovr: props.proOvr }}
          matchPercent={props.matchPercent}
        />
      </div>

      {props.filmProcessing && (
        <p className="mt-3 font-mono text-sm text-soft">
          Your film is being analyzed. This report updates automatically when it finishes.
        </p>
      )}

      {/* Head to head + key moments */}
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="label">Head to head</h2>
            <span className="font-mono text-xs text-soft">out of 99</span>
          </div>
          <HeadToHead
            athlete={props.athleteMetrics}
            pro={props.proMetrics}
            keys={props.headToHeadKeys}
            athleteName={props.athleteName}
            proName={props.pro.knownAs}
          />
        </section>

        {props.film ? (
          <KeyMoments
            moments={props.film.moments}
            videoUrl={props.film.videoUrl}
            limit={5}
            footer={
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-film-soft">{props.film.line}</span>
                <Link href="/film" className="font-semibold text-film-accent hover:underline">
                  Full breakdown →
                </Link>
              </div>
            }
          />
        ) : (
          <section className="flex flex-col justify-between gap-6 bg-film p-6 text-film-ink">
            <div>
              <h2 className="font-mono text-xs font-semibold tracking-[0.12em] text-film-accent uppercase">Key moments</h2>
              <p className="mt-4 text-xl font-bold">Add your highlight reel</p>
              <p className="mt-2 text-film-soft">
                We tag every take-on, pass and shot, rate whether it worked, and
                let you jump straight to each one. Film also verifies your match.
              </p>
            </div>
            {!props.filmProcessing && (
              <Link href="/upload" className="self-start bg-film-accent px-5 py-3 font-semibold text-film transition hover:opacity-90">
                Upload highlights
              </Link>
            )}
          </section>
        )}
      </div>

      {/* Scout's notes + study clips */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="card p-5">
          <h2 className="label">Scout&apos;s notes</h2>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="display text-3xl">{props.pro.knownAs}</span>
            <span className="font-mono text-lg font-semibold text-cobalt">{props.matchPercent}%</span>
          </div>
          {props.runnersUp.length > 0 && (
            <p className="mt-2 text-soft">
              Also: {props.runnersUp.map((r) => `${r.knownAs} ${r.matchPercent}%`).join(" · ")}
            </p>
          )}
          <div className="mt-5 whitespace-pre-line border-l-[3px] border-ink pl-4 leading-relaxed text-ink-2">
            {props.explanation}
          </div>
          {topGap && (
            <p className="mt-4 font-mono text-sm text-pen">
              ↳ priority: {topGap.label.toLowerCase()}. You&apos;re {Math.round(topGap.delta)} points behind.
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="label">Study {props.pro.knownAs}</h2>
          <p className="mt-3 text-sm text-soft">{props.pro.styleSummary}</p>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {props.pro.studyClips.map((clip) => (
              <li key={clip.title}>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(clip.youtubeQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3 transition hover:text-cobalt"
                >
                  <span className="font-semibold">▶ {clip.title}</span>
                  <span className="mt-1 block text-sm text-soft">{clip.focusPoint}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Training: team practice (free) + on your own (program) */}
      <div className="mt-5 grid border border-rule bg-surface lg:grid-cols-2">
        <section className="p-5">
          <h2 className="label">At team practice · this week</h2>
          <p className="mt-2 text-sm text-soft">No extra training. Try these at the practices you already go to.</p>
          <ol className="mt-4 space-y-3">
            {props.practiceFocus.map((h) => (
              <li key={h.title} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-3">
                <span className="truncate border border-rule px-2 py-0.5 text-center font-mono text-[11px] text-soft">
                  {h.metricLabel ?? "Habit"}
                </span>
                <span>
                  <span className="font-semibold">{h.title}</span>
                  <span className="block text-sm text-soft">{h.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="border-t border-rule p-5 lg:border-t-0 lg:border-l">
          <h2 className="label">On your own · close the gap</h2>
          <p className="mt-2 text-sm text-soft">Where {props.pro.knownAs} is furthest ahead of you.</p>
          <div className="mt-4 space-y-3">
            {props.gaps.map((g) => (
              <div key={g.label} className="grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-3">
                <span className="text-sm">{g.label}</span>
                <span className="relative h-2.5 bg-track">
                  <i className="absolute inset-y-0 left-0 bg-cobalt" style={{ width: `${Math.min(100, Math.max(6, 100 - g.delta))}%` }} />
                </span>
                <span className="text-right font-mono text-sm font-semibold text-pen">−{Math.round(g.delta)}</span>
              </div>
            ))}
          </div>
          <Link href="/plans" className="btn-primary mt-5">
            See the 8-week program →
          </Link>
        </section>
      </div>

      {/* Builder + recruiting */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card flex flex-col justify-between gap-4 p-5">
          <div>
            <h2 className="label">Build your 99 OVR self</h2>
            <p className="mt-2 text-soft">Spend attribute points on the player you want to become, then see which pros play like your build.</p>
          </div>
          <Link href="/build" className="btn-secondary self-start">Open the builder →</Link>
        </section>
        <section className="card flex flex-col justify-between gap-4 p-5">
          <div>
            <h2 className="label">Recruiting profile</h2>
            <p className="mt-2 text-soft">
              {props.recruiting?.published
                ? "Your profile is live. Send the link to college and club coaches."
                : "One page for coaches: your ratings, best positions, pro match and film."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="btn-secondary">
              {props.recruiting ? "Edit profile" : "Build my profile →"}
            </Link>
            {props.recruiting?.published && (
              <Link href={`/p/${props.recruiting.slug}`} className="text-sm font-semibold text-cobalt hover:underline">
                View
              </Link>
            )}
          </div>
        </section>
      </div>

      <p className="mt-10 text-center text-sm text-soft">
        Game changed?{" "}
        <Link href="/upload" className="text-ink underline hover:text-cobalt">Upload new film</Link>
        {" "}or{" "}
        <Link href="/quiz" className="text-ink underline hover:text-cobalt">retake the quiz</Link>
      </p>
    </main>
  );
}
