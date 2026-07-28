/**
 * The canonical playstyle metric model.
 *
 * This is the contract between every layer of the system:
 *  - AI extractors (questionnaire parser, video analyzer) OUTPUT this shape
 *  - Pro player profiles are AUTHORED in this shape
 *  - The matching engine COMPARES vectors in this shape
 *
 * All metrics are 0–100, where 50 ≈ average for a competitive amateur.
 * Keep this list stable; add metrics only with a migration plan for
 * existing pro profiles and assessments.
 */

export const METRIC_KEYS = [
  "verticalProgression", // urge to move ball toward goal vs. recycle possession
  "dribbleDensity", // frequency + ambition of take-ons per touch
  "spatialCreation", // movement/passes that generate space for self or others
  "finishingInstinct", // box presence, shot volume, goal threat
  "passingRange", // short combination play vs. switches and long diagonals
  "tempoControl", // dictates rhythm, slows/speeds the game deliberately
  "pressingIntensity", // counter-press triggers, defensive sprints off-ball
  "defensivePositioning", // reading danger, screening, recovery discipline
  "duelAggression", // appetite for physical/ground/aerial duels
  "explosiveness", // acceleration bursts, first-step separation
  "endurance", // sustained output, late-game running volume
  "scanning", // pre-receive shoulder checks, awareness under pressure
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

/** A full 12-dimension playstyle vector. */
export type MetricVector = Record<MetricKey, number>;

/** Per-metric confidence (0–1) from an extractor; video can't see everything. */
export type MetricConfidence = Partial<Record<MetricKey, number>>;

export type PositionGroup = "GK" | "CB" | "FB" | "DM" | "CM" | "AM" | "W" | "ST";

/** Which position groups are considered adjacent for soft match gating. */
export const ADJACENT_POSITIONS: Record<PositionGroup, PositionGroup[]> = {
  GK: [],
  CB: ["DM", "FB"],
  FB: ["W", "CB"],
  DM: ["CM", "CB"],
  CM: ["DM", "AM"],
  AM: ["CM", "W", "ST"],
  W: ["AM", "FB", "ST"],
  ST: ["AM", "W"],
};

/**
 * Position-specific metric weights. Similarity in metrics that define a
 * position matters more than similarity in incidental ones — a striker
 * match should hinge on finishing/explosiveness, not passing range.
 * Values are relative; the matcher normalizes them to sum to 1.
 */
export const POSITION_WEIGHTS: Record<PositionGroup, MetricVector> = {
  GK: base({ defensivePositioning: 3, scanning: 3, passingRange: 2, tempoControl: 2 }),
  CB: base({ defensivePositioning: 3, duelAggression: 3, passingRange: 2, verticalProgression: 2, scanning: 2 }),
  FB: base({ endurance: 3, explosiveness: 2, pressingIntensity: 2, spatialCreation: 2, defensivePositioning: 2 }),
  DM: base({ defensivePositioning: 3, tempoControl: 3, scanning: 3, passingRange: 2, duelAggression: 2 }),
  CM: base({ tempoControl: 2, passingRange: 2, endurance: 2, verticalProgression: 2, scanning: 2, pressingIntensity: 2 }),
  AM: base({ spatialCreation: 3, passingRange: 3, dribbleDensity: 2, scanning: 2, verticalProgression: 2 }),
  W: base({ dribbleDensity: 3, explosiveness: 3, verticalProgression: 2, finishingInstinct: 2, spatialCreation: 2 }),
  ST: base({ finishingInstinct: 3, spatialCreation: 2, explosiveness: 2, duelAggression: 2, verticalProgression: 2 }),
};

/** Build a weight vector: every metric starts at 1, overrides boost the definers. */
function base(overrides: Partial<MetricVector>): MetricVector {
  const v = Object.fromEntries(METRIC_KEYS.map((k) => [k, 1])) as MetricVector;
  return { ...v, ...overrides };
}

export function toArray(v: MetricVector): number[] {
  return METRIC_KEYS.map((k) => v[k]);
}

export function isCompleteVector(v: unknown): v is MetricVector {
  return (
    typeof v === "object" &&
    v !== null &&
    METRIC_KEYS.every((k) => {
      const n = (v as Record<string, unknown>)[k];
      return typeof n === "number" && n >= 0 && n <= 100;
    })
  );
}
