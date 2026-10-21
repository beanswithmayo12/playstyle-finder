"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FLAIR } from "@/lib/flair";

export interface TeaserMatch {
  name: string;
  archetype: string;
  percent: number;
}

/**
 * The moment before the reveal: progress steps (flair 12), pitch lines drawn
 * behind the page (13), and a locked report (9) whose pro name shuffles
 * through the roster (10) until the real match lands.
 */
export function SignUpStage({
  steps,
  current,
  eyebrow,
  heading,
  lede,
  children,
  teaser,
}: {
  steps: [string, string, string];
  /** Index of the step in progress; 3 = all done. */
  current: 1 | 2 | 3;
  eyebrow?: string;
  heading: string;
  lede?: ReactNode;
  children?: ReactNode;
  teaser?: {
    names: string[];
    position: string | null;
    match: TeaserMatch | null;
    onLanded?: () => void;
  } | null;
}) {
  const showTeaser = FLAIR.lockedTeaser && !!teaser;
  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 pt-6 pb-20 text-ink">
      {FLAIR.pitchLines && <PitchLines />}
      <div className="relative">
        {FLAIR.progressSteps && <Steps labels={steps} current={current} />}
        <div
          className={
            showTeaser
              ? "mt-10 grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]"
              : "mx-auto mt-10 flex max-w-xl flex-col items-center text-center"
          }
        >
          <div className="min-w-0">
            {eyebrow && <p className="label">{eyebrow}</p>}
            <h1 className="display mt-3 text-4xl sm:text-5xl">{heading}</h1>
            {lede && <div className="mt-3 max-w-md text-soft">{lede}</div>}
            {children && <div className="mt-6">{children}</div>}
          </div>
          {showTeaser && teaser && <LockedReport {...teaser} />}
        </div>
      </div>
    </main>
  );
}

function Steps({ labels, current }: { labels: string[]; current: 1 | 2 | 3 }) {
  return (
    <div className="relative max-w-md">
      <div aria-hidden className="absolute top-[11px] right-3 left-3 h-0.5 bg-rule">
        <i
          className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700 ease-out"
          style={{ width: `${(Math.min(current, 2) / 2) * 100}%` }}
        />
      </div>
      <ol className="relative flex justify-between">
        {labels.map((label, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li
              key={label}
              aria-current={now ? "step" : undefined}
              className={`flex flex-col gap-1.5 font-mono text-[11px] font-semibold tracking-[0.1em] uppercase first:items-start last:items-end [&:nth-child(2)]:items-center ${
                done ? "text-ink" : now ? "text-cobalt" : "text-soft"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center border-2 transition-colors ${
                  done ? "border-ink bg-ink text-paper" : now ? "flair-ring border-cobalt bg-surface" : "border-rule-strong bg-surface"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Faint full-pitch markings that draw themselves behind the page. */
function PitchLines() {
  const paths = [
    "M1 1 H104 V67 H1 Z",
    "M52.5 1 V67",
    "M52.5 24.85 A9.15 9.15 0 1 1 52.5 43.15 A9.15 9.15 0 1 1 52.5 24.85",
    "M1 13.84 H17.5 V54.16 H1",
    "M104 13.84 H87.5 V54.16 H104",
    "M1 24.84 H6.5 V43.16 H1",
    "M104 24.84 H98.5 V43.16 H104",
    "M17.5 26.69 A9.15 9.15 0 0 1 17.5 41.31",
    "M87.5 26.69 A9.15 9.15 0 0 0 87.5 41.31",
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 105 68"
      preserveAspectRatio="xMidYMid meet"
      className="flair-draw pointer-events-none absolute inset-0 h-full w-full"
    >
      {paths.map((d, i) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          style={{ fill: "none", stroke: "var(--rule)", strokeWidth: 0.22, "--i": i } as CSSProperties}
        />
      ))}
    </svg>
  );
}

const SAMPLE_BARS: [string, number, number][] = [
  ["Dribbling", 80, 97],
  ["Explosiveness", 78, 94],
  ["Verticality", 65, 85],
  ["Creation", 58, 72],
];
const LAND_STEPS_MS = [120, 150, 190, 240, 300, 380, 480];

function LockedReport({
  names,
  position,
  match,
  onLanded,
}: {
  names: string[];
  position: string | null;
  match: TeaserMatch | null;
  onLanded?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [compared, setCompared] = useState(1);
  const [landed, setLanded] = useState(false);
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;
  const shuffle = FLAIR.proShuffle && names.length > 0;

  const tick = () => {
    setIdx((i) => (i + 7) % names.length);
    setCompared((c) => (c % names.length) + 1);
  };

  // Keep cycling through the roster until the real match arrives…
  useEffect(() => {
    if (!shuffle || match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(tick, 95);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffle, match]);

  // …then slow down like a slot machine and land on it.
  useEffect(() => {
    if (!match) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delays = shuffle && !reduce ? LAND_STEPS_MS : [];
    let k = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (k < delays.length) {
        tick();
        timer = setTimeout(next, delays[k++]);
        return;
      }
      setLanded(true);
      onLandedRef.current?.();
    };
    next();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, shuffle]);

  const name = landed && match ? match.name : shuffle ? names[idx] : "? ? ? ? ?";
  const sub = landed && match ? match.archetype : shuffle ? `Comparing ${compared}/${names.length} pros…` : "Your pro twin";

  return (
    <div aria-hidden className="relative border-2 border-rule-strong bg-surface">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] border-b border-rule">
        <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] tracking-[0.1em] text-soft uppercase">{position ?? "Player"}</p>
            <p className="truncate text-lg font-extrabold [font-stretch:115%]">You</p>
          </div>
          <span className="font-mono text-2xl font-semibold">??</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center bg-cobalt px-4 text-on-cobalt ${landed ? "flair-stamp" : ""}`}
          style={{ "--stamp-delay": "0ms" } as CSSProperties}
        >
          <span className="display text-3xl tabular-nums">{landed && match ? `${match.percent}%` : "??%"}</span>
          <span className="font-mono text-[10px] tracking-[0.14em]">STYLE MATCH</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3 px-4 py-3 text-right">
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] tracking-[0.1em] text-soft uppercase tabular-nums">{sub}</p>
            <p className={`truncate text-lg font-extrabold [font-stretch:115%] ${landed ? "" : "text-soft"}`}>{name}</p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden p-4">
        {/* Sample content: it stays blurred even after the match lands, since
            the player's real numbers only appear on the dashboard. */}
        <div className="opacity-70 blur-[5px]">
          <p className="label">Head to head</p>
          <div className="mt-3 space-y-2">
            {SAMPLE_BARS.map(([label, you, pro]) => (
              <div key={label} className="grid grid-cols-[2rem_minmax(0,1fr)_6.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm">
                <span className="font-mono font-semibold">··</span>
                <span className="relative h-2 bg-track"><i className="absolute inset-y-0 right-0 bg-ink" style={{ width: `${you}%` }} /></span>
                <span className="text-center text-soft">{label}</span>
                <span className="relative h-2 bg-track"><i className="absolute inset-y-0 left-0 bg-cobalt" style={{ width: `${pro}%` }} /></span>
                <span className="font-mono font-semibold">··</span>
              </div>
            ))}
          </div>
          <ol className="mt-4 bg-film px-3 py-1.5 text-sm text-film-soft">
            {[["0:04", "Take-on", "beats the defender outside", true], ["0:12", "Key pass", "through ball cut out", false], ["0:20", "Shot", "on target from the edge", true]].map(
              ([t, what, detail, ok]) => (
                <li key={t as string} className="grid grid-cols-[3rem_minmax(0,1fr)_1rem] gap-2 border-t border-film-rule py-1.5 first:border-t-0">
                  <span className="font-mono font-semibold text-film-accent">{t}</span>
                  <span className="truncate"><b className="text-film-ink">{what}</b> {detail}</span>
                  <span className={ok ? "text-film-good" : "text-film-bad"}>{ok ? "✓" : "✗"}</span>
                </li>
              ),
            )}
          </ol>
        </div>
        {!landed && (
          <span className="flair-scan pointer-events-none absolute inset-x-0 h-2/5 bg-gradient-to-b from-transparent via-cobalt/15 to-transparent" />
        )}
        <div
          className={`absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 px-3.5 py-2.5 font-mono text-xs font-semibold tracking-[0.08em] whitespace-nowrap uppercase transition-colors ${
            landed ? "bg-cobalt text-on-cobalt" : "bg-ink text-paper"
          }`}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <rect x="3" y="7" width="10" height="8" style={{ fill: "currentColor" }} />
            {/* The shackle swings open once the match lands. */}
            <path
              d={landed ? "M5 7 V5 a3 3 0 0 1 6 0" : "M5 7 V5 a3 3 0 0 1 6 0 V7"}
              style={{ fill: "none", stroke: "currentColor", strokeWidth: 1.8 }}
              transform={landed ? "translate(4 -1.5)" : undefined}
            />
          </svg>
          {landed ? "Opening your report…" : match ? "Unlocking…" : "Unlocks when you sign up"}
        </div>
      </div>
    </div>
  );
}
