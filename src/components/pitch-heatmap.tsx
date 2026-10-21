import { HEAT_COLS, HEAT_ROWS, type HeatMap } from "@/lib/heatmap";

// Pitch drawn in metres (105 × 68), attacking left → right.
const W = 105;
const H = 68;
const CW = W / HEAT_COLS;
const CH = H / HEAT_ROWS;

export function PitchHeatmap({ heat, idPrefix = "pitch" }: { heat: HeatMap; idPrefix?: string }) {
  const clip = `${idPrefix}-clip`;
  const blur = `${idPrefix}-blur`;
  const line = { stroke: "var(--ink)", strokeOpacity: 0.45, strokeWidth: 0.35, fill: "none" };

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label">Where you play</h2>
        <span className="border border-rule px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-soft">
          Demo
        </span>
      </div>
      <p className="display mt-3 text-xl">{heat.zone}</p>

      <svg
        viewBox={`-1 -1 ${W + 2} ${H + 2}`}
        className="mt-4 block w-full"
        role="img"
        aria-label={`Heat map: most active in the ${heat.zone.toLowerCase()}`}
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
        <g clipPath={`url(#${clip})`}>
          <g filter={`url(#${blur})`}>
            {heat.cells.flatMap((row, r) =>
              row.map((v, c) =>
                v < 0.03 ? null : (
                  <rect
                    key={`${r}-${c}`}
                    x={c * CW}
                    y={r * CH}
                    width={CW + 0.05}
                    height={CH + 0.05}
                    style={{ fill: "var(--cobalt)", fillOpacity: Math.min(0.9, v * 0.9) }}
                  />
                ),
              ),
            )}
          </g>
        </g>

        {/* Markings */}
        <rect width={W} height={H} style={line} />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} style={line} />
        <circle cx={W / 2} cy={H / 2} r={9.15} style={line} />
        <circle cx={W / 2} cy={H / 2} r={0.45} style={{ fill: "var(--ink)", fillOpacity: 0.45 }} />
        {/* Penalty areas, six-yard boxes, spots and arcs */}
        <rect x={0} y={13.84} width={16.5} height={40.32} style={line} />
        <rect x={W - 16.5} y={13.84} width={16.5} height={40.32} style={line} />
        <rect x={0} y={24.84} width={5.5} height={18.32} style={line} />
        <rect x={W - 5.5} y={24.84} width={5.5} height={18.32} style={line} />
        <circle cx={11} cy={H / 2} r={0.45} style={{ fill: "var(--ink)", fillOpacity: 0.45 }} />
        <circle cx={W - 11} cy={H / 2} r={0.45} style={{ fill: "var(--ink)", fillOpacity: 0.45 }} />
        <path d="M16.5 26.69 A9.15 9.15 0 0 1 16.5 41.31" style={line} />
        <path d={`M${W - 16.5} 26.69 A9.15 9.15 0 0 0 ${W - 16.5} 41.31`} style={line} />
      </svg>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-faint">
        <span>Own goal</span>
        <span>Attacking →</span>
      </div>

      <h3 className="label mt-5">Common tendencies</h3>
      <ol className="mt-2 divide-y divide-rule border-y border-rule">
        {heat.tendencies.map((t, i) => (
          <li key={t} className="flex gap-3 py-2 text-sm">
            <span className="font-mono text-cobalt">{String(i + 1).padStart(2, "0")}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-faint">
        Estimated from your position and ratings. Heat maps from your actual film are coming.
      </p>
    </section>
  );
}
