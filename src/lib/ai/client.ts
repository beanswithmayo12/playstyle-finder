/**
 * The one place the app talks to Claude: the model setting, the client, and a
 * usage line in the server log for every call, so the real cost per quiz and
 * per reel can be read straight off the terminal (docs/09, Phase 1).
 */

import Anthropic from "@anthropic-ai/sdk";

/**
 * The Claude model for every AI call. Set ANTHROPIC_MODEL in .env to try a
 * different one without touching code. Note: claude-sonnet-5-5 and
 * claude-opus-5-5 need the forced tool calls in ./questionnaire.ts and
 * ./video.ts switched to structured outputs first.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// USD per million tokens (input, output), for the log line only.
const PRICES: Record<string, [number, number]> = {
  "claude-sonnet-5": [2, 10],
  "claude-sonnet-5-5": [2, 10],
  "claude-opus-5-5": [4, 20],
  "claude-haiku-5-5": [0.1, 0.5],
};

// Lazy so demo mode (MOCK_AI=1) never needs a key in the environment.
let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add your key to .env (console.anthropic.com → API keys), or set MOCK_AI="1" to run in demo mode.',
    );
  }
  return (_client ??= new Anthropic());
}

/** Rough cost of one call, from the token counts the API reports. */
export function callCost(usage: Anthropic.Usage, model = AI_MODEL): number | null {
  const price = PRICES[model];
  if (!price) return null;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const input = usage.input_tokens + cacheWrite * 1.25 + cacheRead * 0.1;
  return (input * price[0] + usage.output_tokens * price[1]) / 1_000_000;
}

/**
 * messages.create with a usage line in the log and plain-English errors for
 * the failures you hit while setting up a key.
 */
export async function createMessage(
  label: string,
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">,
): Promise<Anthropic.Message> {
  try {
    const res = await client().messages.create({ ...params, model: AI_MODEL });
    const cost = callCost(res.usage);
    console.info(
      `[ai] ${label} · ${AI_MODEL} · ${res.usage.input_tokens} in / ${res.usage.output_tokens} out` +
        (cost === null ? "" : ` · ≈$${cost.toFixed(4)}`),
    );
    return res;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      throw new Error("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env (console.anthropic.com → API keys).");
    }
    if (e instanceof Anthropic.NotFoundError) {
      throw new Error(`The AI model "${AI_MODEL}" wasn't found. Check ANTHROPIC_MODEL in .env.`);
    }
    if (e instanceof Anthropic.RateLimitError) {
      throw new Error("The AI is getting too many requests right now. Wait a minute and try again.");
    }
    // Everything else (e.g. "credit balance is too low") already has a clear message.
    throw e;
  }
}
