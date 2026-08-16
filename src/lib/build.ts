/**
 * The 2K-style player builder ("your 99 OVR self").
 *
 * Budget rules force real tradeoffs, like a MyPlayer build:
 *  - every attribute has a floor of 25 and a cap of 99
 *  - total spend is capped at BUILD_BUDGET (850 of a possible 1188),
 *    so maxing ~4 signature attributes means staying modest elsewhere
 *
 * The build is matched against the pro roster with the same engine as the
 * quiz, and the (build − quiz) gap drives the training-plan pitch.
 */

import { METRIC_KEYS, POSITION_WEIGHTS, type MetricVector, type PositionGroup } from "./metrics";

export const BUILD_FLOOR = 25;
export const BUILD_MAX = 99;
export const BUILD_BUDGET = 850;

/** Even spread that respects the budget — the editor's starting point. */
export function defaultBuild(): MetricVector {
  const per = Math.floor(BUILD_BUDGET / METRIC_KEYS.length); // 70
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, per])) as MetricVector;
}

export function buildSpent(v: MetricVector): number {
  return METRIC_KEYS.reduce((s, k) => s + v[k], 0);
}

export function buildRemaining(v: MetricVector): number {
  return BUILD_BUDGET - buildSpent(v);
}

export type BuildValidation = { ok: true } | { ok: false; reason: string };

export function validateBuild(v: unknown): BuildValidation {
  if (typeof v !== "object" || v === null) return { ok: false, reason: "not an object" };
  for (const k of METRIC_KEYS) {
    const n = (v as Record<string, unknown>)[k];
    if (typeof n !== "number" || !Number.isInteger(n)) {
      return { ok: false, reason: `${k} must be an integer` };
    }
    if (n < BUILD_FLOOR || n > BUILD_MAX) {
      return { ok: false, reason: `${k} must be between ${BUILD_FLOOR} and ${BUILD_MAX}` };
    }
  }
  if (buildSpent(v as MetricVector) > BUILD_BUDGET) {
    return { ok: false, reason: `total attribute points exceed the ${BUILD_BUDGET} budget` };
  }
  return { ok: true };
}

/**
 * Position-weighted overall rating. A build that pours points into its
 * position's signature attributes rates higher than the same points spread
 * against type — exactly how 2K archetypes work.
 */
export function buildOverall(v: MetricVector, position: PositionGroup): number {
  const w = POSITION_WEIGHTS[position];
  const wSum = METRIC_KEYS.reduce((s, k) => s + w[k], 0);
  const mean = METRIC_KEYS.reduce((s, k) => s + w[k] * v[k], 0) / wSum;
  return Math.round(mean);
}
