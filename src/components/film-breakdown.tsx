"use client";

import { useRef, useState } from "react";
import type { FilmMoment, FilmStat } from "@/lib/film-stats";
import { formatTimestamp } from "@/lib/film-stats";

// Start playback a beat before the tagged frame so the action has context.
const LEAD_IN_SEC = 1;

export function FilmBreakdown({
  stats,
  moments,
  videoUrl,
}: {
  stats: FilmStat[];
  moments: FilmMoment[];
  videoUrl: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  function jumpTo(index: number, t: number) {
    setActive(index);
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, t - LEAD_IN_SEC);
    v.play().catch(() => {});
    v.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const visible = moments
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !filter || m.label === filter);

  return (
    <div className="space-y-6">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full rounded-2xl border border-zinc-800 bg-black"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-6 text-center text-sm text-zinc-500">
          The original video is no longer stored, but your stats from it are below.
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.type} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-2xl font-black text-zinc-50">
                {s.made !== null ? (
                  <>
                    <span className="text-emerald-400">{s.made}</span>
                    <span className="text-zinc-500">/{s.count}</span>
                  </>
                ) : (
                  s.count
                )}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                {s.label}
                {s.made !== null && " made"}
              </p>
            </div>
          ))}
        </div>
      )}

      {moments.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="mr-2 font-semibold">Every moment we tagged</p>
            {[...new Set(moments.map((m) => m.label))].map((label) => (
              <button
                key={label}
                onClick={() => setFilter(filter === label ? null : label)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  filter === label
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ol className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {visible.map(({ m, i }) => (
              <li key={i}>
                <button
                  onClick={() => jumpTo(i, m.t)}
                  disabled={!videoUrl}
                  className={`flex w-full items-center gap-4 px-4 py-3 text-left transition enabled:hover:bg-zinc-900 ${
                    active === i ? "bg-emerald-500/10" : ""
                  }`}
                >
                  <span className="w-12 shrink-0 font-mono text-sm text-emerald-400">
                    {formatTimestamp(m.t)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-100">{m.label}</span>
                    <span className="ml-2 text-sm text-zinc-500">{m.description}</span>
                  </span>
                  {m.outcome === "success" && <span className="text-sm text-emerald-400">✓</span>}
                  {m.outcome === "fail" && <span className="text-sm text-red-400">✗</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
