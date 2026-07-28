"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { MetricVector } from "@/lib/metrics";
import { RadarCompare } from "./radar-compare";

export interface StudyClip {
  title: string;
  youtubeQuery: string;
  focusPoint: string;
}

export interface MatchDashboardProps {
  reveal: boolean;
  athleteName: string;
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
  explanation: string;
  gaps: { label: string; delta: number }[];
  runnersUp: { knownAs: string; matchPercent: number }[];
  shareUrl: string;
}

export function MatchDashboard(props: MatchDashboardProps) {
  const [revealed, setRevealed] = useState(!props.reveal);
  const [copied, setCopied] = useState(false);

  // The reveal moment: brief suspense beat, then fade the match in.
  useEffect(() => {
    if (!revealed) {
      const t = setTimeout(() => setRevealed(true), 1200);
      return () => clearTimeout(t);
    }
  }, [revealed]);

  async function share() {
    const text = `My playstyle is a ${props.matchPercent}% match with ${props.pro.knownAs} ⚽`;
    if (navigator.share) {
      await navigator.share({ title: "Playstyle Finder", text, url: props.shareUrl }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text} ${props.shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-zinc-300">
          ⚽ Playstyle Finder
        </Link>
        <UserButton />
      </header>

      <div
        className={`mx-auto max-w-3xl px-6 pb-24 transition-opacity duration-1000 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        {/* The verdict */}
        <section className="py-10 text-center">
          <p className="text-sm uppercase tracking-widest text-zinc-500">
            {props.athleteName}, your playstyle match is
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-emerald-400 sm:text-6xl">
            {props.pro.knownAs}
          </h1>
          <p className="mt-3 text-lg text-zinc-300">{props.pro.archetype}</p>
          <p className="mt-1 text-sm italic text-zinc-500">&ldquo;{props.pro.tagline}&rdquo;</p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-6 py-2">
            <span className="text-2xl font-bold text-emerald-400">{props.matchPercent}%</span>
            <span className="text-sm text-zinc-400">style match</span>
          </div>
          <div className="mt-6">
            <button
              onClick={share}
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500"
            >
              {copied ? "Link copied ✓" : "Share your match"}
            </button>
          </div>
        </section>

        {/* Radar comparison */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-2 text-lg font-bold">Your profile vs. {props.pro.knownAs}</h2>
          <RadarCompare
            athlete={props.athleteMetrics}
            pro={props.proMetrics}
            proName={props.pro.knownAs}
          />
        </section>

        {/* The tactical why */}
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold">The scouting report</h2>
          <div className="space-y-4 whitespace-pre-line leading-relaxed text-zinc-300">
            {props.explanation}
          </div>
        </section>

        {/* Study footage */}
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-bold">Study {props.pro.knownAs} like a pro</h2>
          <p className="mb-4 text-sm text-zinc-500">{props.pro.styleSummary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {props.pro.studyClips.map((clip) => (
              <a
                key={clip.title}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(clip.youtubeQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-emerald-500/50"
              >
                <p className="font-semibold text-zinc-100">▶ {clip.title}</p>
                <p className="mt-2 text-sm text-zinc-400">{clip.focusPoint}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Runners-up */}
        {props.runnersUp.length > 0 && (
          <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
            <p className="text-sm text-zinc-400">
              You also share DNA with{" "}
              {props.runnersUp.map((r, i) => (
                <span key={r.knownAs}>
                  {i > 0 && " and "}
                  <span className="font-semibold text-zinc-200">{r.knownAs}</span> (
                  {r.matchPercent}%)
                </span>
              ))}
              .
            </p>
          </section>
        )}

        {/* The gap → upsell bridge */}
        <section className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="text-lg font-bold">
            Your development gaps vs. {props.pro.knownAs}
          </h2>
          <div className="mt-4 space-y-3">
            {props.gaps.map((g) => (
              <div key={g.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-zinc-300">{g.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500/70"
                    style={{ width: `${Math.min(100, Math.max(8, 100 - g.delta))}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm font-semibold text-emerald-400">
                  −{Math.round(g.delta)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-zinc-400">
            An 8-week program built around {props.pro.knownAs}&apos;s athletic and
            tactical profile closes these exact gaps.
          </p>
          <Link
            href="/plans"
            className="mt-4 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            See the program →
          </Link>
        </section>

        <p className="mt-10 text-center text-sm text-zinc-600">
          Think your game has changed?{" "}
          <Link href="/quiz" className="text-zinc-400 underline hover:text-zinc-200">
            Retake the analysis
          </Link>
        </p>
      </div>
    </main>
  );
}
