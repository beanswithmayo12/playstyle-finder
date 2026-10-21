import { PROS } from "@/data/pros";
import { RevealClient } from "./reveal-client";

// Server wrapper so only the pro names (for the reveal shuffle) reach the
// browser, not the whole roster file.
export default function RevealPage() {
  return <RevealClient proNames={PROS.map((p) => p.knownAs)} />;
}
