import type { MetricKey } from "@/lib/metrics";

/** Short display names for the 12 metrics (charts, gap bars, share cards). */
export const METRIC_LABELS: Record<MetricKey, string> = {
  verticalProgression: "Verticality",
  dribbleDensity: "Dribbling",
  spatialCreation: "Creation",
  finishingInstinct: "Finishing",
  passingRange: "Passing",
  tempoControl: "Tempo",
  pressingIntensity: "Pressing",
  defensivePositioning: "Defending",
  duelAggression: "Duels",
  explosiveness: "Explosiveness",
  endurance: "Engine",
  scanning: "Scanning",
};
