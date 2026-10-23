import Anthropic from "@anthropic-ai/sdk";
import { METRIC_KEYS, type MetricConfidence, type MetricVector } from "@/lib/metrics";
import { QUESTIONNAIRE_ANALYST_SYSTEM } from "@/lib/prompts";
import { createMessage } from "./client";
import { isMockAI, mockQuestionnaireAnalysis } from "./mock";

const metricProperties = Object.fromEntries(
  METRIC_KEYS.map((k) => [k, { type: "integer", minimum: 0, maximum: 100 }]),
);
const confidenceProperties = Object.fromEntries(
  METRIC_KEYS.map((k) => [k, { type: "number", minimum: 0, maximum: 1 }]),
);

export const submitMetricsTool: Anthropic.Tool = {
  name: "submit_metrics",
  description: "Submit the athlete's completed 12-metric playstyle profile.",
  input_schema: {
    type: "object",
    properties: {
      metrics: {
        type: "object",
        properties: metricProperties,
        required: [...METRIC_KEYS],
      },
      confidence: {
        type: "object",
        properties: confidenceProperties,
        required: [...METRIC_KEYS],
      },
      scoutNotes: {
        type: "string",
        description: "2-3 sentence scout summary of the athlete's style",
      },
    },
    required: ["metrics", "confidence", "scoutNotes"],
  },
};

export interface QuestionnaireAnalysis {
  metrics: MetricVector;
  confidence: MetricConfidence;
  scoutNotes: string;
}

export async function analyzeQuestionnaire(rawAnswers: unknown): Promise<QuestionnaireAnalysis> {
  if (isMockAI()) return mockQuestionnaireAnalysis(rawAnswers);

  const res = await createMessage("quiz scoring", {
    max_tokens: 2000,
    system: QUESTIONNAIRE_ANALYST_SYSTEM,
    tools: [submitMetricsTool],
    tool_choice: { type: "tool", name: "submit_metrics" },
    messages: [{ role: "user", content: JSON.stringify(rawAnswers) }],
  });

  const call = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!call) throw new Error("model did not return metrics");
  return call.input as unknown as QuestionnaireAnalysis;
}
