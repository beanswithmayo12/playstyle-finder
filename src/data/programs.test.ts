import { describe, expect, it } from "vitest";
import { PROGRAMS, buildProgramSessions } from "./programs";
import { PROS } from "./pros";
import { METRIC_KEYS } from "@/lib/metrics";

describe("program generator", () => {
  it("every program expands to 8 weeks × 4 sessions with valid drills", () => {
    for (const def of PROGRAMS) {
      const sessions = buildProgramSessions(def); // throws on unknown drill keys
      expect(sessions.length, def.slug).toBe(32);
      const weeks = new Set(sessions.map((s) => s.week));
      expect(weeks.size).toBe(8);
      for (const s of sessions) {
        expect(s.content.blocks.length).toBeGreaterThanOrEqual(3);
        for (const b of s.content.blocks) expect(b.sets).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("integration week (8) has lower volume than peak weeks", () => {
    for (const def of PROGRAMS) {
      const sessions = buildProgramSessions(def);
      const totalSets = (week: number) =>
        sessions
          .filter((s) => s.week === week)
          .reduce((sum, s) => sum + s.content.blocks.reduce((x, b) => x + b.sets, 0), 0);
      expect(totalSets(8), def.slug).toBeLessThan(totalSets(7));
    }
  });

  it("programs reference real pros and real metric targets", () => {
    const proSlugs = new Set(PROS.map((p) => p.slug));
    for (const def of PROGRAMS) {
      expect(proSlugs.has(def.proSlug), def.proSlug).toBe(true);
      for (const t of def.targets) {
        expect(METRIC_KEYS.includes(t as (typeof METRIC_KEYS)[number]), t).toBe(true);
      }
      expect(new Set(PROGRAMS.map((p) => p.slug)).size).toBe(PROGRAMS.length);
    }
  });
});
