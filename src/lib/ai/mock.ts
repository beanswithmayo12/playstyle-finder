/**
 * MOCK AI MODE — set MOCK_AI=1 in .env to run the whole product with zero
 * Anthropic API calls. Metrics are derived deterministically from the quiz
 * answers via keyword heuristics, so different answers still produce
 * different (and directionally sensible) matches. Output is clearly labeled
 * as demo content. Real mode is untouched when the flag is off.
 */

import { METRIC_KEYS, type MetricConfidence, type MetricVector } from "@/lib/metrics";
import type { QuestionnaireAnalysis } from "./questionnaire";

export function isMockAI(): boolean {
  return process.env.MOCK_AI === "1";
}

/** keyword → metric deltas, matched against the quiz option labels */
const RULES: [string, Partial<MetricVector>][] = [
  ["take them on", { dribbleDensity: 25, explosiveness: 8 }],
  ["invitation to dribble", { dribbleDensity: 10 }],
  ["play forward immediately", { verticalProgression: 22, passingRange: 5 }],
  ["shield it", { tempoControl: 15, duelAggression: 8 }],
  ["one-touch it", { scanning: 10, passingRange: 8 }],
  ["behind the last defender", { verticalProgression: 15, explosiveness: 12, finishingInstinct: 10 }],
  ["pockets between", { spatialCreation: 20, scanning: 12 }],
  ["stretch the pitch", { dribbleDensity: 10, explosiveness: 5 }],
  ["holding my position", { defensivePositioning: 18, tempoControl: 5 }],
  ["i shoot. every time", { finishingInstinct: 25 }],
  ["clearly the best option", { finishingInstinct: 10, scanning: 5 }],
  ["better-placed teammate", { spatialCreation: 15, passingRange: 8 }],
  ["one-twos", { spatialCreation: 10, tempoControl: 8 }],
  ["through-ball", { passingRange: 15, spatialCreation: 15 }],
  ["switch of play", { passingRange: 25, tempoControl: 8 }],
  ["simple, safe", { tempoControl: 8, defensivePositioning: 5 }],
  ["slow it down", { tempoControl: 25, scanning: 8 }],
  ["inject speed", { verticalProgression: 15, explosiveness: 10 }],
  ["sprint at the ball-carrier", { pressingIntensity: 25, endurance: 8 }],
  ["press if they're close", { pressingIntensity: 10 }],
  ["defensive shape", { defensivePositioning: 15 }],
  ["stay high", { finishingInstinct: 8, pressingIntensity: -8 }],
  ["live for them", { duelAggression: 25 }],
  ["win my share", { duelAggression: 10 }],
  ["brains and skill", { scanning: 12, duelAggression: -8 }],
  ["first step", { explosiveness: 25 }],
  ["run hard for 90", { endurance: 25 }],
  ["hard to knock off", { duelAggression: 15, endurance: 5 }],
  ["quick feet", { dribbleDensity: 12, explosiveness: 8 }],
  ["constantly", { scanning: 25 }],
  ["usually, especially", { scanning: 12 }],
];

/** Small deterministic jitter so identical-ish answer sets still differ. */
function jitter(seedText: string, metricIndex: number): number {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 16777619);
  }
  h = Math.imul(h ^ metricIndex, 2654435761);
  return ((h >>> 0) % 9) - 4; // -4..+4
}

export function mockQuestionnaireAnalysis(rawAnswers: unknown): QuestionnaireAnalysis {
  const text = JSON.stringify(rawAnswers).toLowerCase();

  const metrics = {} as MetricVector;
  METRIC_KEYS.forEach((k, i) => {
    metrics[k] = 45 + jitter(text, i);
  });
  for (const [needle, deltas] of RULES) {
    if (!text.includes(needle)) continue;
    for (const [k, d] of Object.entries(deltas)) {
      metrics[k as keyof MetricVector] += d as number;
    }
  }
  for (const k of METRIC_KEYS) {
    metrics[k] = Math.max(20, Math.min(95, Math.round(metrics[k])));
  }

  const confidence = Object.fromEntries(
    METRIC_KEYS.map((k) => [k, 0.55]),
  ) as MetricConfidence;

  return {
    metrics,
    confidence,
    scoutNotes:
      "[Demo mode] Profile generated from questionnaire keywords without AI — enable a real ANTHROPIC_API_KEY and remove MOCK_AI for genuine scouting analysis.",
  };
}

export function mockExplanation(args: {
  proKnownAs: string;
  archetype: string;
  styleSummary: string;
  topGaps: string[];
}): string {
  return [
    `[Demo mode — sample scouting report. Real reports are written by AI from your actual metric profile.]`,
    ``,
    `THE VERDICT: Your answers profile you as a ${args.archetype.toLowerCase()} — the mold of ${args.proKnownAs}. The shape of your game (where you take risks, how you move, what you do off the ball) lines up with how ${args.proKnownAs} plays their role.`,
    ``,
    `THE TACTICAL WHY: ${args.styleSummary}`,
    ``,
    `THE GAP: The biggest distances between your game and ${args.proKnownAs}'s are ${args.topGaps.join(", ")}. Those are trainable — that's what an 8-week block is for.`,
    ``,
    `STUDY LIKE A PRO:`,
    `- Watch the study clips below and track one habit per viewing.`,
    `- Steal one pattern per week and use it in your next match.`,
  ].join("\n");
}
