import { describe, expect, it } from "vitest";
import { PROS } from "@/data/pros";
import { METRIC_KEYS, isCompleteVector, type MetricVector, type PositionGroup } from "./metrics";
import { displayMatchPercent, rankMatches, type ProCandidate } from "./matching";

const candidates: ProCandidate[] = PROS.map((p) => ({
  id: p.slug,
  slug: p.slug,
  knownAs: p.knownAs,
  positionGroup: p.positionGroup as PositionGroup,
  metrics: p.metrics,
}));

/** Scale a pro's vector toward amateur levels while preserving its shape. */
function amateurize(v: MetricVector, factor = 0.6): MetricVector {
  return Object.fromEntries(
    METRIC_KEYS.map((k) => [k, Math.round(v[k] * factor)]),
  ) as MetricVector;
}

describe("roster integrity", () => {
  it("every pro has a complete, in-range metric vector", () => {
    for (const p of PROS) expect(isCompleteVector(p.metrics), p.slug).toBe(true);
  });

  it("slugs are unique", () => {
    expect(new Set(PROS.map((p) => p.slug)).size).toBe(PROS.length);
  });

  it("covers every position group with at least 2 pros", () => {
    const counts = new Map<string, number>();
    for (const p of PROS) counts.set(p.positionGroup, (counts.get(p.positionGroup) ?? 0) + 1);
    for (const group of ["GK", "CB", "FB", "DM", "CM", "AM", "W", "ST"]) {
      expect(counts.get(group) ?? 0, `position ${group}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("metrics have real spread within each position (no flat authoring)", () => {
    // If every pro in a group has near-identical values on a metric, that
    // metric contributes nothing to matching within the group.
    const groups = new Map<string, MetricVector[]>();
    for (const p of PROS) {
      groups.set(p.positionGroup, [...(groups.get(p.positionGroup) ?? []), p.metrics]);
    }
    for (const [group, vectors] of groups) {
      if (vectors.length < 3) continue;
      let variedMetrics = 0;
      for (const k of METRIC_KEYS) {
        const vals = vectors.map((v) => v[k]);
        if (Math.max(...vals) - Math.min(...vals) >= 15) variedMetrics++;
      }
      expect(variedMetrics, `varied metrics in ${group}`).toBeGreaterThanOrEqual(6);
    }
  });
});

describe("rankMatches", () => {
  it("a pro's own vector matches themselves first", () => {
    for (const p of candidates) {
      if (p.positionGroup === "GK") continue; // GK pool of 2 is trivially small
      const ranked = rankMatches(p.metrics, p.positionGroup, candidates);
      expect(ranked[0].pro.slug, `self-match for ${p.slug}`).toBe(p.slug);
    }
  });

  it("an amateur with a pro's profile shape still matches that pro (shape over level)", () => {
    const failures: string[] = [];
    for (const p of candidates) {
      if (p.positionGroup === "GK") continue;
      const ranked = rankMatches(amateurize(p.metrics), p.positionGroup, candidates);
      if (!ranked.slice(0, 2).some((r) => r.pro.slug === p.slug)) {
        failures.push(`${p.slug} → ${ranked.map((r) => r.pro.slug).join(", ")}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("never matches across non-adjacent positions", () => {
    const winger = candidates.find((c) => c.slug === "vinicius-junior")!;
    const ranked = rankMatches(winger.metrics, "W", candidates, 100);
    const positions = new Set(ranked.map((r) => r.pro.positionGroup));
    expect(positions.has("CB")).toBe(false);
    expect(positions.has("GK")).toBe(false);
    expect(positions.has("DM")).toBe(false);
  });

  it("returns per-metric deltas as pro minus athlete", () => {
    const athlete = amateurize(candidates.find((c) => c.slug === "rodri")!.metrics);
    const [best] = rankMatches(athlete, "DM", candidates, 1);
    for (const k of METRIC_KEYS) {
      expect(best.deltas[k]).toBeCloseTo(best.pro.metrics[k] - athlete[k], 5);
    }
  });

  it("similarity scores are within [0, 1] and sorted descending", () => {
    const athlete = amateurize(candidates.find((c) => c.slug === "bukayo-saka")!.metrics);
    const ranked = rankMatches(athlete, "W", candidates, 10);
    for (let i = 0; i < ranked.length; i++) {
      expect(ranked[i].similarity).toBeGreaterThanOrEqual(0);
      expect(ranked[i].similarity).toBeLessThanOrEqual(1);
      if (i > 0) expect(ranked[i].similarity).toBeLessThanOrEqual(ranked[i - 1].similarity);
    }
  });

  it("distinguishes opposite archetypes within a position", () => {
    // A synthetic pure destroyer must match Palhinha ahead of Rodri.
    const destroyer = amateurize(candidates.find((c) => c.slug === "joao-palhinha")!.metrics);
    const ranked = rankMatches(destroyer, "DM", candidates);
    const palhinha = ranked.findIndex((r) => r.pro.slug === "joao-palhinha");
    const rodri = ranked.findIndex((r) => r.pro.slug === "rodri");
    expect(palhinha).toBeGreaterThanOrEqual(0);
    expect(palhinha).toBeLessThan(rodri === -1 ? Infinity : rodri);
  });
});

describe("displayMatchPercent", () => {
  it("stays inside the marketing band regardless of input", () => {
    for (const s of [0, 0.3, 0.5, 0.75, 0.9, 1]) {
      const pct = displayMatchPercent(s);
      expect(pct).toBeGreaterThanOrEqual(70);
      expect(pct).toBeLessThanOrEqual(94);
    }
  });

  it("is monotonic", () => {
    expect(displayMatchPercent(0.9)).toBeGreaterThanOrEqual(displayMatchPercent(0.7));
  });
});
