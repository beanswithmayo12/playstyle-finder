"use client";

import { useEffect, useMemo, useState } from "react";
import { FLAIR } from "@/lib/flair";
import { HEAT_COLS, HEAT_ROWS, heatOverlap, ZONE_COUNT, zoneName, zoneShares, type HeatMap } from "@/lib/heatmap";
import { mirrorPath, PITCH_MOVES } from "./pitch-moves";

// Pitch drawn in metres (105 × 68), attacking left → right.
const W = 105;
const H = 68;
const CW = W / HEAT_COLS;
const CH = H / HEAT_ROWS;
const ZONE_W = W / 3;
const ZONE_H = H / 5;

type Mode = "you" | "pro" | "both";

function HeatLayer({ cells, color, opacity }: { cells: number[][]; color: string; opacity: number }) {
  return (
    <g style={{ opacity, transition: "opacity 0.45s ease" }}>
      {cells.flatMap((row, r) =>
        row.map((v, c) =>
          v < 0.03 ? null : (
            <rect
              key={`${r}-${c}`}
              x={c * CW}
              y={r * CH}
              width={CW + 0.05}
              height={CH + 0.05}
              style={{ fill: color, fillOpacity: Math.min(0.9, v * 0.9) }}
            />
          ),
        ),
      )}
    </g>
  );
}

/**
 * "Where you play": demo heat map plus common tendencies. Flair 3 adds the
 * You / pro / Both toggle, 4 the zone hover, and 5 the drawn tendency moves.
 */
export function PitchHeatmap({
  heat,
  pro,
  idPrefix = "pitch",
  wide = false,
}: {
  heat: HeatMap;
  pro?: { name: string; heat: HeatMap } | null;
  idPrefix?: string;
  /** Pitch and tendencies side by side, for a full-width slot. */
  wide?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("you");
  const [zone, setZone] = useState<number | null>(null);
  const [move, setMove] = useState<number | null>(null);
  const [run, setRun] = useState(0); // remounts the move so it replays
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const proView = FLAIR.proHeatMap && pro ? pro : null;
  const shares = useMemo(() => zoneShares(heat.cells), [heat]);
  const proShares = useMemo(() => (proView ? zoneShares(proView.heat.cells) : null), [proView]);
  const overlap = useMemo(() => (proView ? heatOverlap(heat.cells, proView.heat.cells) : 0), [heat, proView]);

  const title =
    mode === "pro" && proView
      ? `${proView.name}: ${proView.heat.zone}`
      : mode === "both" && proView
        ? `${overlap}% overlap with ${proView.name}`
        : heat.zone;

  function showMove(i: number | null) {
    setMove(i);
    if (i !== null) setRun((n) => n + 1);
  }

  const clip = `${idPrefix}-clip`;
  const blur = `${idPrefix}-blur`;
  const line = { stroke: "var(--ink)", strokeOpacity: 0.45, strokeWidth: 0.35, fill: "none" };
  const spot = { fill: "var(--ink)", fillOpacity: 0.45 };
  const activeMove = move !== null && FLAIR.tendencyMoves ? heat.tendencies[move] : null;

  return (
    <section className="card lift p-5">
      <div className={wide ? "grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]" : ""}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="label">Where you play</h2>
              <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-soft uppercase">
                Demo
              </span>
            </div>
            {proView && (
              <div role="group" aria-label="Whose heat map" className="inline-flex border border-rule-strong font-mono text-xs">
                {(
                  [
                    ["you", "You"],
                    ["pro", proView.name],
                    ["both", "Both"],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1.5 transition-colors ${mode === m ? "bg-ink text-paper" : "text-soft hover:text-ink"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p key={title} className="display mt-3 animate-in text-xl duration-300 fade-in slide-in-from-bottom-1">
            {title}
          </p>

          <div className="relative mt-4">
            <svg
              viewBox={`-1 -1 ${W + 2} ${H + 2}`}
              className="block w-full"
              role="img"
              aria-label={`Heat map: most active in the ${heat.zone.toLowerCase()}`}
              onMouseLeave={() => setZone(null)}
            >
              <defs>
                <clipPath id={clip}>
                  <rect width={W} height={H} />
                </clipPath>
                {/* Fixed region: the default (bbox + 10%) would clip the blur edge. */}
                <filter id={blur} filterUnits="userSpaceOnUse" x={-10} y={-10} width={W + 20} height={H + 20}>
                  <feGaussianBlur stdDeviation="2.6" />
                </filter>
              </defs>

              <rect width={W} height={H} style={{ fill: "var(--paper)" }} />
              <g
                clipPath={`url(#${clip})`}
                style={{ opacity: activeMove ? 0.3 : 1, transition: "opacity 0.3s ease" }}
              >
                <g filter={`url(#${blur})`}>
                  {proView && (
                    <HeatLayer cells={proView.heat.cells} color="var(--heat-pro)" opacity={mode === "you" ? 0 : 1} />
                  )}
                  <HeatLayer cells={heat.cells} color="var(--cobalt)" opacity={mode === "pro" ? 0 : mode === "both" ? 0.85 : 1} />
                </g>
              </g>

              {/* Markings */}
              <rect width={W} height={H} style={line} />
              <line x1={W / 2} y1={0} x2={W / 2} y2={H} style={line} />
              <circle cx={W / 2} cy={H / 2} r={9.15} style={line} />
              <circle cx={W / 2} cy={H / 2} r={0.45} style={spot} />
              {/* Penalty areas, six-yard boxes, spots and arcs */}
              <rect x={0} y={13.84} width={16.5} height={40.32} style={line} />
              <rect x={W - 16.5} y={13.84} width={16.5} height={40.32} style={line} />
              <rect x={0} y={24.84} width={5.5} height={18.32} style={line} />
              <rect x={W - 5.5} y={24.84} width={5.5} height={18.32} style={line} />
              <circle cx={11} cy={H / 2} r={0.45} style={spot} />
              <circle cx={W - 11} cy={H / 2} r={0.45} style={spot} />
              <path d="M16.5 26.69 A9.15 9.15 0 0 1 16.5 41.31" style={line} />
              <path d={`M${W - 16.5} 26.69 A9.15 9.15 0 0 0 ${W - 16.5} 41.31`} style={line} />

              {activeMove && <MoveDrawing key={run} move={activeMove.key} side={heat.moveSide} reduceMotion={reduceMotion} />}

              {FLAIR.zoneHover &&
                Array.from({ length: ZONE_COUNT }, (_, z) => (
                  <rect
                    key={z}
                    x={Math.floor(z / 5) * ZONE_W}
                    y={(z % 5) * ZONE_H}
                    width={ZONE_W}
                    height={ZONE_H}
                    onMouseEnter={() => setZone(z)}
                    onClick={() => setZone(z)}
                    className="cursor-crosshair"
                    style={
                      zone === z
                        ? { fill: "var(--ink)", fillOpacity: 0.06, stroke: "var(--ink)", strokeWidth: 0.35, strokeDasharray: "1 0.8" }
                        : { fill: "transparent" }
                    }
                  />
                ))}
            </svg>

            {FLAIR.zoneHover && zone !== null && (
              <ZoneTip
                zone={zone}
                you={mode === "pro" ? null : shares[zone]}
                pro={mode === "you" || !proShares || !proView ? null : { name: proView.name, share: proShares[zone] }}
              />
            )}
          </div>

          <div className="mt-1.5 flex justify-between gap-3 font-mono text-[11px] text-faint">
            <span>Own goal</span>
            {proView && mode === "both" && (
              <span className="flex gap-3">
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 bg-cobalt" />You</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 bg-heat-pro" />{proView.name}</span>
              </span>
            )}
            <span>Attacking →</span>
          </div>

        </div>

        <div className="min-w-0">
          <h3 className={`label mt-5 ${wide ? "lg:mt-1" : ""}`}>Common tendencies</h3>
          <ol className="mt-2 border-t border-rule">
            {heat.tendencies.map((t, i) => {
              const body = (
                <>
                  <span className="font-mono text-cobalt">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-sm font-semibold">{t.text}</span>
                    <span className="block text-xs text-soft">{t.detail}</span>
                  </span>
                </>
              );
              return (
                <li key={t.key} className="border-b border-rule">
                  {FLAIR.tendencyMoves ? (
                    <button
                      type="button"
                      aria-pressed={move === i}
                      onMouseEnter={() => showMove(i)}
                      onMouseLeave={() => setMove(null)}
                      onFocus={() => showMove(i)}
                      onBlur={() => setMove(null)}
                      onClick={() => (move === i ? setMove(null) : showMove(i))}
                      className={`grid w-full grid-cols-[1.75rem_minmax(0,1fr)] gap-2 py-2 text-left transition-all ${
                        move === i ? "bg-track pl-2" : "hover:bg-track hover:pl-2"
                      }`}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 py-2">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-faint">
            {FLAIR.tendencyMoves && "Hover a tendency to see the move. "}
            {FLAIR.zoneHover && "Hover the pitch to see where you spend your time. "}
            Estimated from your position and ratings. Heat maps from your actual film are coming.
          </p>
        </div>
      </div>
    </section>
  );
}

function ZoneTip({
  zone,
  you,
  pro,
}: {
  zone: number;
  you: number | null;
  pro: { name: string; share: number } | null;
}) {
  const lane = zone % 5;
  const left = Math.min(82, Math.max(18, ((Math.floor(zone / 5) * ZONE_W + ZONE_W / 2 + 1) / (W + 2)) * 100));
  // Top-row zones show the tip underneath so it never covers the controls.
  const below = lane === 0;
  const top = (((below ? ZONE_H : lane * ZONE_H) + 1) / (H + 2)) * 100;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-40 bg-ink px-2.5 py-2 font-mono text-xs leading-relaxed text-paper"
      style={{ left: `${left}%`, top: `${top}%`, transform: below ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))" }}
    >
      <b className="block font-semibold">{zoneName(zone)}</b>
      {you !== null && (
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 bg-cobalt" />
          {pro ? "You" : "Your time"} {Math.round(you * 100)}%
        </span>
      )}
      {pro && (
        <span className="flex items-center gap-1.5">
          <i className="h-2 w-2 bg-heat-pro" />
          {pro.name} {Math.round(pro.share * 100)}%
        </span>
      )}
    </div>
  );
}

function MoveDrawing({
  move,
  side,
  reduceMotion,
}: {
  move: keyof typeof PITCH_MOVES;
  side: "left" | "right";
  reduceMotion: boolean;
}) {
  const m = PITCH_MOVES[move];
  const flip = (d: string) => (side === "right" ? mirrorPath(d) : d);
  const at = (p: [number, number]): [number, number] => (side === "right" ? [p[0], H - p[1]] : p);
  const [ex, ey] = at(m.end);
  const ink = { fill: "none", stroke: "var(--ink)", strokeLinecap: "round" as const };
  return (
    <g>
      {m.opponent &&
        (() => {
          const [ox, oy] = at(m.opponent);
          return (
            <path
              d={`M${ox - 1.4} ${oy - 1.4} L${ox + 1.4} ${oy + 1.4} M${ox + 1.4} ${oy - 1.4} L${ox - 1.4} ${oy + 1.4}`}
              style={{ stroke: "var(--pen)", strokeWidth: 0.8, strokeLinecap: "round" }}
            />
          );
        })()}
      {m.pass && <path d={flip(m.pass)} pathLength={1} style={{ ...ink, strokeWidth: 0.7, strokeDasharray: "0.035 0.025" }} />}
      {m.carry && <path d={flip(m.carry)} pathLength={1} className="move-draw" style={{ ...ink, strokeWidth: 0.8 }} />}
      {reduceMotion ? (
        <circle cx={ex} cy={ey} r={1.2} style={{ fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 0.45 }} />
      ) : (
        <circle r={1.2} style={{ fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 0.45 }}>
          <animateMotion
            ref={(el) => {
              try {
                (el as SVGAnimationElement | null)?.beginElement();
              } catch {
                // Older engines without SMIL: the ball just stays put.
              }
            }}
            begin="indefinite"
            dur={m.pass && m.carry ? "1.1s" : "0.85s"}
            fill="freeze"
            path={flip(m.ball)}
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.4 0 0.2 1"
          />
        </circle>
      )}
    </g>
  );
}
