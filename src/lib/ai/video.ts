import Anthropic from "@anthropic-ai/sdk";
import { METRIC_KEYS, type MetricConfidence, type MetricVector } from "@/lib/metrics";
import { VIDEO_AGGREGATOR_SYSTEM, VIDEO_FRAME_ANALYST_SYSTEM } from "@/lib/prompts";
import { submitMetricsTool, type QuestionnaireAnalysis } from "./questionnaire";
import { isMockAI, mockQuestionnaireAnalysis } from "./mock";

// Lazy so mock mode never needs an API key in the environment.
let _anthropic: Anthropic | null = null;
function anthropicClient(): Anthropic {
  return (_anthropic ??= new Anthropic());
}

export interface VideoEvent {
  type: string;
  tStart: number;
  tEnd: number;
  description: string;
  outcome?: "success" | "fail" | "unclear"; // absent on pre-1.1.0 event logs
  confidence: number;
}

const submitEventsTool: Anthropic.Tool = {
  name: "submit_events",
  description: "Submit the observed soccer events for this frame sequence.",
  input_schema: {
    type: "object",
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "take_on", "progressive_action", "retention_action", "shot",
                "creative_pass", "defensive_action", "aerial_or_physical_duel",
                "off_ball_run", "scan", "burst",
              ],
            },
            tStart: { type: "number" },
            tEnd: { type: "number" },
            description: { type: "string" },
            outcome: { type: "string", enum: ["success", "fail", "unclear"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["type", "tStart", "tEnd", "description", "outcome", "confidence"],
        },
      },
      context: {
        type: "string",
        description: "One-line note on footage quality / level of play, once per batch",
      },
    },
    required: ["events", "context"],
  },
};

export interface Frame {
  timestampSec: number;
  base64: string;
}

/** Analyze one batch of frames into an event log. */
export async function analyzeFrameBatch(
  frames: Frame[],
  meta: { jerseyColor: string; jerseyNumber: string },
): Promise<{ events: VideoEvent[]; context: string }> {
  if (isMockAI()) {
    return {
      events: mockEvents(frames),
      context: "[Demo mode] canned events — no real film analysis performed",
    };
  }

  const system = VIDEO_FRAME_ANALYST_SYSTEM.replace("{{JERSEY_COLOR}}", meta.jerseyColor)
    .replace("{{JERSEY_NUMBER}}", meta.jerseyNumber);

  const content: Anthropic.ContentBlockParam[] = frames.flatMap((f) => [
    { type: "text" as const, text: `t=${f.timestampSec}s` },
    {
      type: "image" as const,
      source: { type: "base64" as const, media_type: "image/jpeg" as const, data: f.base64 },
    },
  ]);

  const res = await anthropicClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 3000,
    system,
    tools: [submitEventsTool],
    tool_choice: { type: "tool", name: "submit_events" },
    messages: [{ role: "user", content }],
  });

  const call = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!call) throw new Error("frame analysis returned no events payload");
  return call.input as { events: VideoEvent[]; context: string };
}

/** Convert the merged event log into the canonical metric vector. */
export async function aggregateEvents(
  events: VideoEvent[],
  contexts: string[],
  position: string,
  reelDurationSec: number,
): Promise<QuestionnaireAnalysis> {
  if (isMockAI()) return mockQuestionnaireAnalysis({ position, events });

  const res = await anthropicClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    system: VIDEO_AGGREGATOR_SYSTEM,
    tools: [submitMetricsTool],
    tool_choice: { type: "tool", name: "submit_metrics" },
    messages: [
      {
        role: "user",
        content: JSON.stringify({ position, reelDurationSec, footageContext: contexts, events }),
      },
    ],
  });
  const call = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!call) throw new Error("aggregation returned no metrics payload");
  return call.input as unknown as QuestionnaireAnalysis;
}

/**
 * Confidence-weighted merge of video + questionnaire metrics (docs/04):
 * film wins where film sees well; the quiz wins where film can't see.
 */
export function mergeByConfidence(
  video: { metrics: MetricVector; confidence: MetricConfidence },
  quiz: { metrics: MetricVector; confidence: MetricConfidence },
): { metrics: MetricVector; confidence: MetricConfidence } {
  const metrics = {} as MetricVector;
  const confidence: MetricConfidence = {};
  for (const k of METRIC_KEYS) {
    const cv = video.confidence[k] ?? 0.1;
    const cq = quiz.confidence[k] ?? 0.1;
    const wv = cv / (cv + cq);
    metrics[k] = Math.round(wv * video.metrics[k] + (1 - wv) * quiz.metrics[k]);
    confidence[k] = Math.max(cv, cq);
  }
  return { metrics, confidence };
}

/** Demo mode: a deterministic spread of plausible events across the batch. */
function mockEvents(frames: Frame[]): VideoEvent[] {
  const cycle: [string, VideoEvent["outcome"], string][] = [
    ["take_on", "success", "beats the defender on the outside"],
    ["progressive_action", "success", "carries the ball forward into space"],
    ["scan", "unclear", "checks the shoulder before receiving"],
    ["creative_pass", "fail", "tries a through ball that is cut out"],
    ["take_on", "fail", "loses the ball in a 1v1"],
    ["shot", "success", "hits the target from the edge of the box"],
    ["defensive_action", "success", "wins the ball back with a tackle"],
    ["burst", "unclear", "accelerates away from the marker"],
  ];
  const events: VideoEvent[] = [];
  for (let i = 0; i < frames.length; i += 2) {
    const t = frames[i].timestampSec;
    const [type, outcome, what] = cycle[Math.floor(t / 4) % cycle.length];
    events.push({ type, tStart: t, tEnd: t + 2, description: `[Demo] ${what}`, outcome, confidence: 0.5 });
  }
  return events;
}
