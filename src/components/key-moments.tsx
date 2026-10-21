"use client";

import { useRef, useState, type ReactNode } from "react";
import type { FilmMoment } from "@/lib/film-stats";
import { formatTimestamp } from "@/lib/film-stats";

// Start playback a beat before the tagged frame so the action has context.
const LEAD_IN_SEC = 1;

/**
 * The film panel: reel player plus every tagged moment; tapping a moment jumps
 * the video to it. Uses the film tokens, so it stays dark in both themes.
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
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-film-2 px-6 text-center text-sm text-film-soft">
          The original video is no longer stored, but every moment from it is below.
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
              className={`grid w-full grid-cols-[3.25rem_minmax(0,1fr)_1.25rem] items-center gap-3 px-2 py-2.5 text-left transition enabled:hover:bg-film-accent/10 ${
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
