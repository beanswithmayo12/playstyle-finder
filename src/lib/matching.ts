/**
 * The player-matching engine.
 *
 * Pipeline: position gating → z-score standardization → weighted cosine
 * similarity (style shape) blended with a magnitude term (level-adjusted
 * intensity). See docs/03-matching-engine.md for the math and rationale.
 */

import {
  ADJACENT_POSITIONS,
  METRIC_KEYS,
  POSITION_WEIGHTS,
  type MetricVector,
  type PositionGroup,
} from "./metrics";

export interface ProCandidate {
  id: string;
  slug: string;
  knownAs: string;
  positionGroup: PositionGroup;
  metrics: MetricVector;
}

export interface MatchScore {
  pro: ProCandidate;
  similarity: number; // 0–1 blended score
  cosine: number; // shape similarity component
  magnitude: number; // intensity similarity component
  deltas: MetricVector; // pro − athlete, per metric (for the sales page)
}

/** How much shape matters vs. absolute intensity. Shape dominates: an
 * amateur playmaker should match De Bruyne even if every raw number is lower. */
const SHAPE_WEIGHT = 0.8;

/** Same-position pros compete at full strength; adjacent positions carry a
 * small penalty so they only win when the style fit is clearly better. */
const ADJACENT_POSITION_PENALTY = 0.06;

export function rankMatches(
  athleteMetrics: MetricVector,
  athletePosition: PositionGroup,
  pros: ProCandidate[],
  topN = 3,
): MatchScore[] {
  // 1. Position gate: same group + adjacent groups only.
  const allowed = new Set<PositionGroup>([
    athletePosition,
    ...ADJACENT_POSITIONS[athletePosition],
  ]);
  const candidates = pros.filter((p) => allowed.has(p.positionGroup));

  // 2. Standardize each metric across the candidate pool (z-scores), so a
  //    metric where everyone scores ~90 (e.g. pro endurance) can't dominate.
  const stats = poolStats(candidates.map((p) => p.metrics).concat([athleteMetrics]));
  const a = standardize(athleteMetrics, stats);

  // 3. Position-specific weights, normalized to sum to 1.
  const weights = normalizeWeights(POSITION_WEIGHTS[athletePosition]);

  const scored = candidates.map((pro) => {
    const p = standardize(pro.metrics, stats);

    const cosine = weightedCosine(a, p, weights);
    const magnitude = magnitudeSimilarity(athleteMetrics, pro.metrics, weights);

    let similarity =
      SHAPE_WEIGHT * rescale(cosine) + (1 - SHAPE_WEIGHT) * magnitude;
    if (pro.positionGroup !== athletePosition) {
      similarity -= ADJACENT_POSITION_PENALTY;
    }

    const deltas = Object.fromEntries(
      METRIC_KEYS.map((k) => [k, round1(pro.metrics[k] - athleteMetrics[k])]),
    ) as MetricVector;

    return { pro, similarity: clamp01(similarity), cosine, magnitude, deltas };
  });

  return scored.sort((x, y) => y.similarity - x.similarity).slice(0, topN);
}

// ─────────────────────────── math helpers ───────────────────────────

type PoolStats = Record<string, { mean: number; sd: number }>;

function poolStats(vectors: MetricVector[]): PoolStats {
  const stats: PoolStats = {};
  for (const k of METRIC_KEYS) {
    const vals = vectors.map((v) => v[k]);
    const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
    const sd =
      Math.sqrt(vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length) || 1;
    stats[k] = { mean, sd };
  }
  return stats;
}

function standardize(v: MetricVector, stats: PoolStats): number[] {
  return METRIC_KEYS.map((k) => (v[k] - stats[k].mean) / stats[k].sd);
}

function normalizeWeights(w: MetricVector): number[] {
  const arr = METRIC_KEYS.map((k) => w[k]);
  const sum = arr.reduce((s, x) => s + x, 0);
  return arr.map((x) => x / sum);
}

/** Cosine similarity with per-dimension weights: Σwᵢaᵢbᵢ / (‖a‖w·‖b‖w). */
function weightedCosine(a: number[], b: number[], w: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += w[i] * a[i] * b[i];
    na += w[i] * a[i] * a[i];
    nb += w[i] * b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Intensity term on RAW (0–100) values: 1 − weighted mean absolute gap / 100.
 * Keeps a low-output athlete from matching an extreme-output pro on shape
 * alone, without letting level differences dominate.
 */
function magnitudeSimilarity(a: MetricVector, b: MetricVector, w: number[]): number {
  let gap = 0;
  METRIC_KEYS.forEach((k, i) => {
    gap += w[i] * Math.abs(a[k] - b[k]);
  });
  return 1 - gap / 100;
}

/** Map cosine's [-1, 1] onto [0, 1]. */
function rescale(c: number): number {
  return (c + 1) / 2;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

/**
 * Present the blended score as a marketing-friendly percentage.
 * Raw similarity for a decent match lands ~0.75–0.9; athletes expect to see
 * "87% match", so we stretch the useful band. Purely presentational — never
 * use this for ranking.
 */
export function displayMatchPercent(similarity: number): number {
  return Math.round(clamp01((similarity - 0.5) / 0.45) * 24 + 70); // 70–94%
}
