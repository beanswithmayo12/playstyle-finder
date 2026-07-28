/**
 * Matcher tuning harness — run with: npx tsx scripts/tune-matcher.ts
 *
 * For every pro, builds a synthetic amateur (their vector scaled toward
 * amateur levels + deterministic noise) and prints the top-3 matches.
 * Eyeball the table: the pro themself should almost always rank #1-2, and
 * runners-up should be stylistic neighbors, not random position-mates.
 * See docs/03-matching-engine.md → Tuning Loop.
 */

import { PROS } from "../src/data/pros";
import { METRIC_KEYS, type MetricVector, type PositionGroup } from "../src/lib/metrics";
import { displayMatchPercent, rankMatches, type ProCandidate } from "../src/lib/matching";

const candidates: ProCandidate[] = PROS.map((p) => ({
  id: p.slug,
  slug: p.slug,
  knownAs: p.knownAs,
  positionGroup: p.positionGroup as PositionGroup,
  metrics: p.metrics,
}));

/** Deterministic pseudo-noise so runs are reproducible. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 12 - 6; // ±6 points
}

function syntheticAmateur(v: MetricVector, seedBase: number): MetricVector {
  return Object.fromEntries(
    METRIC_KEYS.map((k, i) => [
      k,
      Math.max(0, Math.min(100, Math.round(v[k] * 0.6 + noise(seedBase * 31 + i)))),
    ]),
  ) as MetricVector;
}

let selfTop1 = 0;
let selfTop2 = 0;

console.log("Synthetic amateur (0.6× + noise) → top-3 matches\n");
candidates.forEach((pro, idx) => {
  const athlete = syntheticAmateur(pro.metrics, idx + 1);
  const ranked = rankMatches(athlete, pro.positionGroup, candidates);
  const selfRank = ranked.findIndex((r) => r.pro.slug === pro.slug);
  if (selfRank === 0) selfTop1++;
  if (selfRank >= 0 && selfRank <= 1) selfTop2++;

  const marker = selfRank === 0 ? "  " : selfRank === 1 ? "~ " : "!!";
  const top3 = ranked
    .map((r) => `${r.pro.knownAs} (${displayMatchPercent(r.similarity)}%)`)
    .join("  |  ");
  console.log(`${marker} [${pro.positionGroup.padEnd(2)}] ${pro.knownAs.padEnd(24)} → ${top3}`);
});

console.log(
  `\nSelf-match: top-1 ${selfTop1}/${candidates.length}, top-2 ${selfTop2}/${candidates.length}`,
);
console.log("Rows marked !! need attention: metric authoring or weight tuning.");
