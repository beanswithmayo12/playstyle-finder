# 04 — AI Prompts for Processing

The importable prompt constants live in [`src/lib/prompts.ts`](../src/lib/prompts.ts).
This doc covers how to call them correctly.

## The Four Prompts

| Prompt | Input | Output | When |
|---|---|---|---|
| `QUESTIONNAIRE_ANALYST_SYSTEM` | Raw quiz answers (JSON) | 12-metric vector + confidence | Synchronously on quiz submit |
| `VIDEO_FRAME_ANALYST_SYSTEM` | 20–30 timestamped frames per batch | Event log | Inngest job, per frame batch |
| `VIDEO_AGGREGATOR_SYSTEM` | Merged event log + position | 12-metric vector + confidence | Inngest job, after all batches |
| `MATCH_EXPLAINER_SYSTEM` | Athlete metrics + pro profile + deltas | Prose explanation | After matching |

## Guaranteed-Valid JSON via Tool Use

Never parse metrics out of free text. Force the model through a tool schema —
the API validates the shape and you get typed data:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { METRIC_KEYS } from "@/lib/metrics";
import { QUESTIONNAIRE_ANALYST_SYSTEM } from "@/lib/prompts";

const anthropic = new Anthropic();

const metricProperties = Object.fromEntries(
  METRIC_KEYS.map((k) => [k, { type: "integer", minimum: 0, maximum: 100 }]),
);
const confidenceProperties = Object.fromEntries(
  METRIC_KEYS.map((k) => [k, { type: "number", minimum: 0, maximum: 1 }]),
);

export const submitMetricsTool = {
  name: "submit_metrics",
  description: "Submit the athlete's completed 12-metric playstyle profile.",
  input_schema: {
    type: "object" as const,
    properties: {
      metrics: { type: "object", properties: metricProperties, required: [...METRIC_KEYS] },
      confidence: { type: "object", properties: confidenceProperties, required: [...METRIC_KEYS] },
      scoutNotes: { type: "string", description: "2-3 sentence scout summary of the style" },
    },
    required: ["metrics", "confidence", "scoutNotes"],
  },
};

export async function analyzeQuestionnaire(rawAnswers: unknown) {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    system: QUESTIONNAIRE_ANALYST_SYSTEM,
    tools: [submitMetricsTool],
    tool_choice: { type: "tool", name: "submit_metrics" }, // force the call
    messages: [{ role: "user", content: JSON.stringify(rawAnswers) }],
  });
  const call = res.content.find((b) => b.type === "tool_use");
  if (!call) throw new Error("model did not return metrics");
  return call.input as {
    metrics: Record<string, number>;
    confidence: Record<string, number>;
    scoutNotes: string;
  };
}
```

The video prompts use the same pattern with a `submit_events` tool (array of
`{ type, tStart, tEnd, description, confidence }` objects).

## Sending Video Frames

```ts
const frameBlocks = frames.flatMap((f) => [
  { type: "text" as const, text: `t=${f.timestampSec}s` },
  {
    type: "image" as const,
    source: { type: "base64" as const, media_type: "image/jpeg" as const, data: f.base64 },
  },
]);

await anthropic.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 3000,
  system: VIDEO_FRAME_ANALYST_SYSTEM
    .replace("{{JERSEY_COLOR}}", meta.jerseyColor)
    .replace("{{JERSEY_NUMBER}}", meta.jerseyNumber),
  tools: [submitEventsTool],
  tool_choice: { type: "tool", name: "submit_events" },
  messages: [{ role: "user", content: frameBlocks }],
});
```

Batch 20–30 frames per request; run batches in parallel from the Inngest job;
concatenate the event logs before the aggregator call.

## Merging Video + Questionnaire (HYBRID assessments)

When both inputs exist, merge per metric by confidence:

```ts
const merged = METRIC_KEYS.map((k) => {
  const q = quiz.confidence[k], v = video.confidence[k];
  const wq = q / (q + v || 1), wv = 1 - wq;
  return [k, Math.round(wq * quiz.metrics[k] + wv * video.metrics[k])];
});
```

Video wins on what film shows well (dribbling, explosiveness, finishing);
the questionnaire wins on what film can't show (endurance, tempo, tactical
intent). The confidence fields make that arbitration automatic.

## Prompt-Engineering Notes (why these prompts are written this way)

- **"Score RELATIVE to their position"** — without it, every defender scores
  low on attacking metrics and matching collapses to position-matching.
- **"Do not cluster scores in 45–65"** — LLMs hedge toward the middle;
  clustered vectors make cosine similarity meaningless. Demanding commitment
  spreads the distribution.
- **Highlight-bias correction** — reels are success-only; without the explicit
  cap instruction, every video user becomes a 90-finishing striker.
- **Confidence as a first-class output** — it powers the hybrid merge AND
  lets the dashboard honestly badge low-evidence metrics ("estimated").
- **"Never invent statistics"** (explainer) — the #1 credibility risk is the
  explanation citing fake stats about the pro. The explainer only gets to use
  the numbers you pass in.
- **Version everything** — `PROMPT_VERSION` is stored in `Assessment.modelInfo`
  so you can A/B prompt revisions against real inputs before rolling out.
