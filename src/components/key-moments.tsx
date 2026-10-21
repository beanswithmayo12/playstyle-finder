"use client";

import { useRef, useState, type ReactNode } from "react";
import { FLAIR } from "@/lib/flair";
import type { FilmMoment } from "@/lib/film-stats";
import { formatTimestamp } from "@/lib/film-stats";

// Start playback a beat before the tagged frame so the action has context.
const LEAD_IN_SEC = 1;

/**
 * The film panel: reel player plus every tagged moment; tapping a moment jumps
 * the video to it. With flair 6, a timeline under the reel marks every moment
 * and follows the playhead. Uses the film tokens, so it stays dark in both themes.
 */
export function KeyMoments({
  moments,
  videoUrl,
  limit,
  filters = false,
  footer,
}: {
  moments: FilmMoment[];
  videoUrl: string | null;
  limit?: number;
  filters?: boolean;
  footer?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  // Until the video reports its length, size the timeline to the last moment.
  const span = duration || Math.max(1, ...moments.map((m) => m.t + 4));

  function onTime(v: HTMLVideoElement) {
    setNow(v.currentTime);
    // Highlight the moment that's playing.
    let current: number | null = null;
    moments.forEach((m, i) => {
      if (m.t <= v.currentTime + LEAD_IN_SEC) current = i;
    });
    if (!v.paused && current !== null) setActive(current);
  }

  function jumpTo(index: number, t: number) {
    setActive(index);
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, t - LEAD_IN_SEC);
    v.play().catch(() => {});
  }

  const visible = moments
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => !filter || m.label === filter)
    .slice(0, limit ?? moments.length);

  return (
    <div className="bg-film p-5 text-film-ink">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-xs font-semibold tracking-[0.12em] text-film-accent uppercase">Key moments</h2>
        <span className="font-mono text-xs text-film-soft">tap to jump in your reel</span>
      </div>

      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
          onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => onTime(e.currentTarget)}
          onSeeked={(e) => setNow(e.currentTarget.currentTime)}
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-film-2 px-6 text-center text-sm text-film-soft">
          The original video is no longer stored, but every moment from it is below.
        </div>
      )}

      {FLAIR.filmScrubber && videoUrl && (
        <div className="relative mt-4 h-1.5 bg-film-rule" aria-label="Reel timeline">
          <span
            className="absolute inset-y-0 left-0 bg-film-accent/60 transition-[width] duration-300 ease-linear"
            style={{ width: `${Math.min(100, (now / span) * 100)}%` }}
          />
          {moments.map((m, i) => (
            <button
              key={i}
              type="button"
              title={`${formatTimestamp(m.t)} · ${m.label}`}
              aria-label={`Jump to ${m.label} at ${formatTimestamp(m.t)}`}
              onClick={() => jumpTo(i, m.t)}
              className={`absolute -top-1.5 h-[18px] w-[3px] -translate-x-1/2 transition-transform hover:scale-y-125 ${
                m.outcome === "success" ? "bg-film-good" : m.outcome === "fail" ? "bg-film-bad" : "bg-film-soft"
              }`}
              style={{ left: `${(m.t / span) * 100}%` }}
            />
          ))}
          <span
            className="pointer-events-none absolute -top-[5px] h-4 w-1 -translate-x-1/2 bg-film-ink shadow-[0_0_0_3px_rgba(143,176,255,0.35)] transition-[left] duration-300 ease-linear"
            style={{ left: `${Math.min(100, (now / span) * 100)}%` }}
          />
        </div>
      )}

      {filters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[...new Set(moments.map((m) => m.label))].map((label) => (
            <button
              key={label}
              onClick={() => setFilter(filter === label ? null : label)}
              className={`border px-2.5 py-1 font-mono text-xs transition ${
                filter === label
                  ? "border-film-accent bg-film-accent/15 text-film-ink"
                  : "border-film-rule text-film-soft hover:text-film-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ol className="mt-3">
        {visible.map(({ m, i }) => (
          <li key={i} className="border-b border-film-rule last:border-b-0">
            <button
              onClick={() => jumpTo(i, m.t)}
              disabled={!videoUrl}
              className={`relative grid w-full grid-cols-[3.25rem_minmax(0,1fr)_1.25rem] items-center gap-3 px-2 py-2.5 text-left transition-all enabled:hover:bg-film-accent/10 ${
                FLAIR.filmScrubber
                  ? "before:absolute before:left-1.5 before:text-[9px] before:text-film-accent before:opacity-0 before:transition-opacity before:content-['▶'] enabled:hover:pl-6 enabled:hover:before:opacity-100"
                  : ""
              } ${
                active === i ? "bg-film-accent/15 shadow-[inset_3px_0_0_var(--film-accent)]" : ""
              }`}
            >
              <span className="font-mono font-semibold text-film-accent tabular-nums">{formatTimestamp(m.t)}</span>
              <span className="min-w-0 truncate">
                <span className="font-bold">{m.label}</span>{" "}
                <span className="text-film-soft">{m.description}</span>
              </span>
              <span className="text-center font-bold">
                {m.outcome === "success" && <span className="text-film-good">✓</span>}
                {m.outcome === "fail" && <span className="text-film-bad">✗</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
