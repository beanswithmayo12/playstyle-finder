/**
 * "Where you play": a demo pitch heat map plus the athlete's common
 * tendencies, estimated from position, preferred foot and the metric
 * profile. No pitch locations are tagged from film yet, so the UI labels
 * the map as a demo estimate. Pure, so it is unit-testable.
 *
 * Coordinates are in the athlete's attacking frame, 0–100 on both axes:
 *  x = own goal line (0) → opponent goal line (100)
 *  y = left touchline (0) → right touchline (100), facing the attack
 */

import type { MetricKey, MetricVector, PositionGroup } from "@/lib/metrics";

export type Foot = "LEFT" | "RIGHT" | "BOTH";

export interface PitchPoint {
  x: number;
  y: number;
  weight: number;
}

export interface HeatMap {
  /** rows × cols densities, 0–1, row 0 = left touchline, col 0 = own goal line */
  cells: number[][];
  /** e.g. "Central · final third" */
  zone: string;
  tendencies: string[];
}

export const HEAT_COLS = 21; // 5 m columns on a 105 m pitch
export const HEAT_ROWS = 14; // ~4.9 m rows on a 68 m pitch

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Gaussian kernel density over the pitch, in metres so blobs stay round. */
export function densityGrid(points: PitchPoint[], sigmaMetres = 10): number[][] {
  const cells: number[][] = [];
  let max = 0;
  for (let r = 0; r < HEAT_ROWS; r++) {
    const row: number[] = [];
    const cy = ((r + 0.5) / HEAT_ROWS) * 100;
    for (let c = 0; c < HEAT_COLS; c++) {
      const cx = ((c + 0.5) / HEAT_COLS) * 100;
      let v = 0;
      for (const p of points) {
        const dx = (cx - p.x) * 1.05;
        const dy = (cy - p.y) * 0.68;
        v += p.weight * Math.exp(-(dx * dx + dy * dy) / (2 * sigmaMetres * sigmaMetres));
      }
      row.push(v);
      max = Math.max(max, v);
    }
    cells.push(row);
  }
  return max > 0 ? cells.map((row) => row.map((v) => v / max)) : cells;
}

const TENDENCY: Record<MetricKey, string> = {
  dribbleDensity: "Takes defenders on 1v1",
  explosiveness: "Explodes into space with a quick first step",
  verticalProgression: "Looks forward first, playing and carrying vertically",
  finishingInstinct: "Gets into the box to finish",
  spatialCreation: "Finds pockets between the lines",
  passingRange: "Switches play with longer passes",
  tempoControl: "Sets the tempo on the ball",
  scanning: "Checks shoulders before receiving",
  pressingIntensity: "Presses high to win it back",
  defensivePositioning: "Holds shape and reads danger early",
  duelAggression: "Goes looking for duels",
  endurance: "Covers ground box to box",
};

/** Flank y for wide roles. */
function flanks(position: PositionGroup, foot: Foot): number[] {
  // Fullbacks usually play on their strong-foot side. Wingers are as often
  // inverted as not, so we don't guess their side.
  if (position === "FB" && foot !== "BOTH") return [foot === "LEFT" ? 10 : 90];
  return [10, 90];
}

/** Primary area (weight 1) + supporting spots for each position. */
function anchors(position: PositionGroup, foot: Foot): PitchPoint[] {
  const p = (x: number, y: number, weight: number): PitchPoint => ({ x, y, weight });
  const wide = (fn: (f: number, inward: number) => PitchPoint[]) =>
    flanks(position, foot).flatMap((f) => fn(f, f < 50 ? 1 : -1));
  switch (position) {
    case "GK":
      return [p(5, 50, 1), p(14, 50, 0.35)];
    case "CB":
      return [p(20, 50, 1), p(26, 36, 0.45), p(26, 64, 0.45)];
    case "FB":
      return wide((f, i) => [p(42, f, 1), p(64, f + 4 * i, 0.55), p(22, f + 14 * i, 0.5)]);
    case "DM":
      return [p(36, 50, 1), p(44, 38, 0.45), p(44, 62, 0.45)];
    case "CM":
      return [p(50, 50, 1), p(42, 36, 0.4), p(60, 64, 0.4), p(60, 36, 0.4), p(42, 64, 0.4)];
    case "AM":
      return [p(70, 50, 1), p(76, 36, 0.45), p(76, 64, 0.45)];
    case "W":
      return wide((f, i) => [p(76, f, 1), p(86, f + 14 * i, 0.55), p(60, f, 0.4)]);
    case "ST":
      return [p(86, 50, 1), p(78, 42, 0.45), p(92, 58, 0.4)];
  }
}

/** Position anchors, shifted by what the metric profile says they do. */
export function estimatedPoints(position: PositionGroup, foot: Foot, m: MetricVector): PitchPoint[] {
  const base = anchors(position, foot);
  if (position === "GK") return base;
  const s = (k: MetricKey) => clamp((m[k] - 55) / 40, 0, 1); // 55 → 0, 95 → 1
  const extra: PitchPoint[] = [];

  for (const a of base.filter((b) => b.weight === 1)) {
    const inward = a.y < 50 ? 1 : a.y > 50 ? -1 : 0;
    // Drifts inside into the half-spaces.
    if (inward !== 0 && s("spatialCreation") > 0) {
      extra.push({ x: Math.max(a.x, 66), y: a.y + 20 * inward, weight: 0.8 * s("spatialCreation") });
    }
    // Pace and verticality push the map forward.
    const runs = (s("explosiveness") + s("verticalProgression")) / 2;
    if (runs > 0) extra.push({ x: Math.min(94, a.x + 14), y: a.y, weight: 0.55 * runs });
    // Deeper defensive work.
    if (s("defensivePositioning") > 0) {
      extra.push({ x: Math.max(8, a.x - 16), y: a.y, weight: 0.5 * s("defensivePositioning") });
    }
    // Engine: covers both ends.
    if (s("endurance") > 0) {
      extra.push({ x: Math.max(10, a.x - 22), y: a.y, weight: 0.35 * s("endurance") });
      extra.push({ x: Math.min(92, a.x + 22), y: a.y, weight: 0.35 * s("endurance") });
    }
  }
  if (position !== "CB" && s("finishingInstinct") > 0) {
    extra.push({ x: 88, y: 50, weight: 0.85 * s("finishingInstinct") });
  }
  if (s("pressingIntensity") > 0) extra.push({ x: 74, y: 50, weight: 0.35 * s("pressingIntensity") });
  return [...base, ...extra];
}

function zoneLabel(position: PositionGroup, foot: Foot): string {
  if (position === "GK") return "Own box";
  if (position === "W" || position === "FB") {
    const side = flanks(position, foot);
    const where = side.length > 1 ? "Wide" : side[0] < 50 ? "Left flank" : "Right flank";
    return `${where} · ${position === "W" ? "final" : "middle"} third`;
  }
  const third = { CB: "defensive", DM: "middle", CM: "middle", AM: "final", ST: "final" }[position];
  return `Central · ${third} third`;
}

export function buildHeatMap(position: PositionGroup, foot: Foot, metrics: MetricVector): HeatMap {
  return {
    cells: densityGrid(estimatedPoints(position, foot, metrics)),
    zone: zoneLabel(position, foot),
    // The athlete's three strongest traits, read as on-pitch habits.
    tendencies: (Object.keys(TENDENCY) as MetricKey[])
      .sort((a, b) => metrics[b] - metrics[a])
      .slice(0, 3)
      .map((k) => TENDENCY[k]),
  };
}
