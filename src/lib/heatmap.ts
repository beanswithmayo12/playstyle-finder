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
/** Which flank a wide player works; BOTH when it isn't known. */
export type Side = "LEFT" | "RIGHT" | "BOTH";

export interface PitchPoint {
  x: number;
  y: number;
  weight: number;
}

export interface Tendency {
  key: MetricKey;
  text: string;
  detail: string;
}

export interface HeatMap {
  /** rows × cols densities, 0–1, row 0 = left touchline, col 0 = own goal line */
  cells: number[][];
  /** e.g. "Central · final third" */
  zone: string;
  tendencies: Tendency[];
  /** Flank the tendency moves are drawn on. */
  moveSide: "left" | "right";
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

const TENDENCY: Record<MetricKey, [text: string, detail: string]> = {
  dribbleDensity: ["Takes defenders on 1v1", "Goes at the defender instead of recycling the ball."],
  explosiveness: ["Explodes into space with a quick first step", "Sprints in behind before the defender can react."],
  verticalProgression: ["Looks forward first", "Plays and carries the ball toward goal early."],
  finishingInstinct: ["Gets into the box to finish", "Arrives in scoring spots and takes the shot."],
  spatialCreation: ["Finds pockets between the lines", "Drifts inside to receive where defenders can't reach."],
  passingRange: ["Switches play with longer passes", "Moves the ball across the pitch in one pass."],
  tempoControl: ["Sets the tempo on the ball", "Keeps it moving with quick, short combinations."],
  scanning: ["Checks shoulders before receiving", "Knows the next move before the ball arrives."],
  pressingIntensity: ["Presses high to win it back", "Sprints at the ball carrier the moment it's lost."],
  defensivePositioning: ["Holds shape and reads danger early", "Gets back into position and cuts out passes."],
  duelAggression: ["Goes looking for duels", "Steps in and contests every loose ball."],
  endurance: ["Covers ground box to box", "Still running hard late in the game."],
};

/** Flank y for wide roles. */
function flanks(position: PositionGroup, foot: Foot, side?: Side): number[] {
  if (side === "LEFT") return [10];
  if (side === "RIGHT") return [90];
  // Fullbacks usually play on their strong-foot side. Wingers are as often
  // inverted as not, so we don't guess their side.
  if (!side && position === "FB" && foot !== "BOTH") return [foot === "LEFT" ? 10 : 90];
  return [10, 90];
}

/** Primary area (weight 1) + supporting spots for each position. */
function anchors(position: PositionGroup, foot: Foot, side?: Side): PitchPoint[] {
  const p = (x: number, y: number, weight: number): PitchPoint => ({ x, y, weight });
  const wide = (fn: (f: number, inward: number) => PitchPoint[]) =>
    flanks(position, foot, side).flatMap((f) => fn(f, f < 50 ? 1 : -1));
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
export function estimatedPoints(position: PositionGroup, foot: Foot, m: MetricVector, side?: Side): PitchPoint[] {
  const base = anchors(position, foot, side);
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

function zoneLabel(position: PositionGroup, foot: Foot, side?: Side): string {
  if (position === "GK") return "Own box";
  if (position === "W" || position === "FB") {
    const f = flanks(position, foot, side);
    const where = f.length > 1 ? "Wide" : f[0] < 50 ? "Left flank" : "Right flank";
    return `${where} · ${position === "W" ? "final" : "middle"} third`;
  }
  const third = { CB: "defensive", DM: "middle", CM: "middle", AM: "final", ST: "final" }[position];
  return `Central · ${third} third`;
}

export function buildHeatMap(position: PositionGroup, foot: Foot, metrics: MetricVector, side?: Side): HeatMap {
  const f = flanks(position, foot, side);
  return {
    cells: densityGrid(estimatedPoints(position, foot, metrics, side)),
    zone: zoneLabel(position, foot, side),
    // The athlete's three strongest traits, read as on-pitch habits.
    tendencies: (Object.keys(TENDENCY) as MetricKey[])
      .sort((a, b) => metrics[b] - metrics[a])
      .slice(0, 3)
      .map((k) => ({ key: k, text: TENDENCY[k][0], detail: TENDENCY[k][1] })),
    moveSide: f.length === 1 && f[0] > 50 ? "right" : "left",
  };
}

// ───────────────────────── Zones and overlap ─────────────────────────

const LANES = ["Left wing", "Left half-space", "Central", "Right half-space", "Right wing"];
const THIRDS = ["defensive third", "middle third", "final third"];

/** 15 zones: index = third × 5 + lane (lanes run left touchline → right). */
export const ZONE_COUNT = 15;

export function zoneName(zone: number): string {
  return `${LANES[zone % 5]} · ${THIRDS[Math.floor(zone / 5)]}`;
}

/** Share of the map's total heat in each zone (sums to 1). */
export function zoneShares(cells: number[][]): number[] {
  const shares = new Array<number>(ZONE_COUNT).fill(0);
  let total = 0;
  cells.forEach((row, r) =>
    row.forEach((v, c) => {
      const third = Math.min(2, Math.floor((((c + 0.5) / HEAT_COLS) * 100) / (100 / 3)));
      const lane = Math.min(4, Math.floor((((r + 0.5) / HEAT_ROWS) * 100) / 20));
      shares[third * 5 + lane] += v;
      total += v;
    }),
  );
  return total > 0 ? shares.map((v) => v / total) : shares;
}

/** How much of the pro's ground the athlete also covers, 0–100. */
export function heatOverlap(athlete: number[][], pro: number[][]): number {
  let shared = 0;
  let proTotal = 0;
  athlete.forEach((row, r) =>
    row.forEach((v, c) => {
      shared += Math.min(v, pro[r][c]);
      proTotal += pro[r][c];
    }),
  );
  return proTotal > 0 ? Math.round((shared / proTotal) * 100) : 0;
}
