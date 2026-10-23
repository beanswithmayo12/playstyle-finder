/**
 * Check that the real AI is set up: sends one tiny request with the key and
 * model from .env, then prints the reply and what it cost (well under a cent).
 *
 *   npm run ai:check
 */

import "dotenv/config";
import { AI_MODEL, createMessage } from "../src/lib/ai/client";

async function main() {
  if (process.env.MOCK_AI === "1") {
    console.log('Demo mode is on (MOCK_AI="1"), so the app makes no AI calls.');
    console.log('To use the real AI, remove MOCK_AI from .env (or set MOCK_AI=""), then run this again.\n');
  }
  console.log(`Calling ${AI_MODEL}…`);
  const res = await createMessage("ai:check", {
    max_tokens: 1000,
    messages: [{ role: "user", content: "Reply with exactly: Playstyle Finder is connected." }],
  });
  const text = res.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join(" ")
    .trim();
  console.log(`\nClaude says: ${text || "(no text)"}`);
  console.log("\n✓ The AI is working. Restart `npm run dev` so the site picks up the change.");
}

main().catch((e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
