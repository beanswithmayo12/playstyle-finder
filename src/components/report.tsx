/**
 * Shared "scouting report" building blocks. Hook-free markup, so they render
 * in both server and client components.
 */

import type { CSSProperties } from "react";
import { FLAIR } from "@/lib/flair";
import { METRIC_KEYS, POSITION_WEIGHTS, type MetricKey, type MetricVector, type PositionGroup } from "@/lib/metrics";
import { CountUp } from "./count-up";
import { METRIC_LABELS } from "./metric-labels";

export interface ScoreSide {
  name: string;
  sub: string;
  ovr: number;
}

/**
 * "Jordan 74 | 93% style match | 91 Vinícius Jr." Pass `kickoffDelay` (ms) to
 * play the count-up and stamp intro (flair 1) once the board is on screen.
 */
export function Scoreboard({
  athlete,
  pro,
  matchPercent,
  mini = false,
  kickoffDelay,
}: {
  athlete: ScoreSide;
  pro: ScoreSide;
  matchPercent: number;
  mini?: boolean;
  kickoffDelay?: number;
}) {
  const pad = mini ? "px-3 py-2.5" : "px-5 py-4";
  const name = mini ? "text-base" : "text-xl sm:text-2xl";
  const ovr = mini ? "text-2xl" : "text-3xl sm:text-4xl";
  const kick = FLAIR.scoreboardKickoff && kickoffDelay !== undefined;
  const num = (value: number, delay: number) => (kick ? <CountUp value={value} delay={kickoffDelay + delay} /> : value);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] border-[1.5px] border-rule-strong bg-surface">
      <div className={`flex min-w-0 items-center gap-3 ${pad}`}>
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] tracking-[0.1em] text-soft uppercase">{athlete.sub}</p>
          <p className={`truncate font-extrabold [font-stretch:115%] ${name}`}>{athlete.name}</p>
        </div>
        <span className={`ml-auto font-mono font-semibold tabular-nums ${ovr}`}>{num(athlete.ovr, 150)}</span>
      </div>
      <div
        className={`flex flex-col items-center justify-center bg-cobalt text-on-cobalt ${mini ? "px-3" : "px-6"} ${kick ? "flair-stamp" : ""}`}
        style={kick ? ({ "--stamp-delay": `${kickoffDelay + 850}ms` } as CSSProperties) : undefined}
      >
        <span className={`display tabular-nums ${mini ? "text-3xl" : "text-4xl sm:text-5xl"}`}>{num(matchPercent, 850)}%</span>
        <span className="font-mono text-[10px] tracking-[0.14em]">{mini ? "MATCH" : "STYLE MATCH"}</span>
      </div>
      <div className={`flex min-w-0 items-center gap-3 ${pad}`}>
        <span className={`font-mono font-semibold tabular-nums ${ovr}`}>{num(pro.ovr, 150)}</span>
        <div className="ml-auto min-w-0 text-right">
          <p className="truncate font-mono text-[11px] tracking-[0.1em] text-soft uppercase">{pro.sub}</p>
          <p className={`truncate font-extrabold [font-stretch:115%] ${name}`}>{pro.name}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The attributes that define a position, most important first — the ones a
 * head-to-head should lead with.
 */
export function signatureMetrics(position: PositionGroup, count = 6): MetricKey[] {
  const w = POSITION_WEIGHTS[position];
  return [...METRIC_KEYS].sort((a, b) => w[b] - w[a]).slice(0, count);
}

/**
 * Mirrored bars: athlete in ink on the left, pro in cobalt on the right. With
 * flair 2 the bars race out on load and hovering a row shows the gap.
 */
export function HeadToHead({
  athlete,
  pro,
  keys,
  athleteName,
  proName,
}: {
  athlete: MetricVector;
  pro: MetricVector;
  keys: MetricKey[];
  athleteName: string;
  proName: string;
}) {
  const race = FLAIR.racingBars;
  return (
    <div>
      <div className="space-y-1">
        {keys.map((k, i) => {
          const gap = athlete[k] - pro[k];
          const order = { "--i": i } as CSSProperties;
          return (
            <div
              key={k}
              className={`grid grid-cols-[2.25rem_minmax(0,1fr)_7.5rem_minmax(0,1fr)_2.25rem] items-center gap-2 py-[3px] ${
                race ? "group transition-colors hover:bg-track" : ""
              }`}
            >
              <span className="text-right font-mono font-semibold tabular-nums">{athlete[k]}</span>
              <span className="relative h-2.5 bg-track group-hover:bg-surface">
                <i className={`absolute inset-y-0 right-0 origin-right bg-ink ${race ? "flair-race" : ""}`} style={{ width: `${athlete[k]}%`, ...order }} />
              </span>
              <span className="relative truncate text-center text-sm text-soft">
                <span className={race ? "transition-opacity group-hover:opacity-0" : ""}>{METRIC_LABELS[k]}</span>
                {race && (
                  <span
                    className={`absolute inset-0 grid translate-y-1 place-items-center font-mono text-[13px] font-semibold opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 ${
                      gap < 0 ? "text-pen" : "text-good"
                    }`}
                  >
                    {gap < 0 ? `−${-gap} behind` : gap > 0 ? `+${gap} ahead` : "even"}
                  </span>
                )}
              </span>
              <span className="relative h-2.5 bg-track group-hover:bg-surface">
                <i className={`absolute inset-y-0 left-0 origin-left bg-cobalt ${race ? "flair-race" : ""}`} style={{ width: `${pro[k]}%`, ...order }} />
              </span>
              <span className="font-mono font-semibold tabular-nums">{pro[k]}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between font-mono text-xs tracking-[0.08em] text-soft uppercase">
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-ink" />{athleteName}</span>
        <span className="inline-flex items-center gap-2">{proName}<i className="h-3 w-3 bg-cobalt" /></span>
      </div>
    </div>
  );
}
