import { describe, expect, it } from "vitest";
import type { VideoEvent } from "@/lib/ai/video";
import { computeFilmStats, filmMoments, formatTimestamp, statLine } from "./film-stats";

const ev = (type: string, tStart: number, outcome?: VideoEvent["outcome"]): VideoEvent => ({
  type,
  tStart,
  tEnd: tStart + 2,
  description: `[Demo] ${type}`,
  outcome,
  confidence: 0.8,
});

describe("computeFilmStats", () => {
  it("counts attempts and successes for rated actions", () => {
    const stats = computeFilmStats([
      ev("take_on", 4, "success"),
      ev("take_on", 10, "fail"),
      ev("take_on", 16, "success"),
      ev("shot", 20, "unclear"),
    ]);
    const takeOns = stats.find((s) => s.type === "take_on")!;
    expect(takeOns).toMatchObject({ count: 3, made: 2 });
    // A shot with no judged outcome can't produce a success rate.
    expect(stats.find((s) => s.type === "shot")!.made).toBeNull();
  });

  it("never rates unrated actions like scans", () => {
    const [scans] = computeFilmStats([ev("scan", 1, "success"), ev("scan", 3)]);
    expect(scans).toMatchObject({ type: "scan", count: 2, made: null });
  });

  it("handles legacy event logs without outcomes", () => {
    const [takeOns] = computeFilmStats([ev("take_on", 1), ev("take_on", 5)]);
    expect(takeOns).toMatchObject({ count: 2, made: null });
  });

  it("omits action types that never happened and ignores unknown types", () => {
    const stats = computeFilmStats([ev("shot", 1, "success"), ev("mystery", 2)]);
    expect(stats.map((s) => s.type)).toEqual(["shot"]);
  });
});

describe("filmMoments", () => {
  it("sorts by time, labels in singular, and strips the demo prefix", () => {
    const moments = filmMoments([ev("shot", 30, "success"), ev("take_on", 8, "fail")]);
    expect(moments.map((m) => m.t)).toEqual([8, 30]);
    expect(moments[0]).toMatchObject({ label: "Take-on", description: "take_on", outcome: "fail" });
  });

  it("clamps negative timestamps to zero", () => {
    expect(filmMoments([ev("scan", -3)])[0].t).toBe(0);
  });
});

describe("formatting", () => {
  it("formats timestamps as m:ss", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(73)).toBe("1:13");
    expect(formatTimestamp(9.9)).toBe("0:09");
  });

  it("builds a headline stat line", () => {
    const line = statLine(
      computeFilmStats([ev("take_on", 1, "success"), ev("take_on", 3, "fail"), ev("scan", 5)]),
    );
    expect(line).toBe("2 take-ons (1 successful) · 1 scan");
  });
});
