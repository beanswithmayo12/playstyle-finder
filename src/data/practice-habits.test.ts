import { describe, expect, it } from "vitest";
import { METRIC_KEYS } from "@/lib/metrics";
import { PROGRAMS } from "./programs";
import {
  GENERAL_HABITS,
  PRACTICE_HABITS,
  buildTeamPracticeSessions,
  weeklyPracticeFocus,
} from "./practice-habits";

describe("practice habit library", () => {
  it("has at least two habits for every metric", () => {
    for (const k of METRIC_KEYS) expect(PRACTICE_HABITS[k].length, k).toBeGreaterThanOrEqual(2);
  });
});

describe("weeklyPracticeFocus", () => {
  it("gives one habit per top gap plus one general athletic habit", () => {
    const focus = weeklyPracticeFocus(["scanning", "explosiveness", "endurance", "duelAggression"], 0);
    expect(focus.map((f) => f.metric)).toEqual(["scanning", "explosiveness", "endurance", null]);
    expect(GENERAL_HABITS).toContainEqual(focus[3].habit);
  });

  it("rotates habits week to week", () => {
    const week0 = weeklyPracticeFocus(["scanning"], 0);
    const week1 = weeklyPracticeFocus(["scanning"], 1);
    expect(week0[0].habit.title).not.toBe(week1[0].habit.title);
  });
});

describe("team-practice track", () => {
  it("builds eight weekly guides per program with target and general habits", () => {
    for (const def of PROGRAMS) {
      const sessions = buildTeamPracticeSessions(def);
      expect(sessions.map((s) => s.week), def.slug).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      for (const s of sessions) {
        expect(s.day).toBe(0);
        expect(s.content.blocks.length).toBe(def.targets.length + 1);
        expect(s.content.blocks.every((b) => b.kind === "habit")).toBe(true);
      }
    }
  });
});
