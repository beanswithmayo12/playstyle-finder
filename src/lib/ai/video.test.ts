import { describe, expect, it } from "vitest";
import { METRIC_KEYS, type MetricConfidence, type MetricVector } from "@/lib/metrics";
import { mergeByConfidence } from "./video";

function vec(n: number): MetricVector {
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, n])) as MetricVector;
}
function conf(n: number): MetricConfidence {
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, n])) as MetricConfidence;
}

describe("mergeByConfidence", () => {
  it("high-confidence video dominates low-confidence quiz", () => {
    const merged = mergeByConfidence(
      { metrics: vec(90), confidence: conf(0.9) },
      { metrics: vec(10), confidence: conf(0.1) },
    );
    for (const k of METRIC_KEYS) expect(merged.metrics[k]).toBeGreaterThan(70);
  });

  it("equal confidence averages the sources", () => {
    const merged = mergeByConfidence(
      { metrics: vec(80), confidence: conf(0.5) },
      { metrics: vec(40), confidence: conf(0.5) },
    );
    for (const k of METRIC_KEYS) expect(merged.metrics[k]).toBe(60);
  });

  it("quiz fills in what film can't see (per-metric arbitration)", () => {
    const videoConf = conf(0.8);
    videoConf.endurance = 0.1; // reels don't show endurance
    const quizConf = conf(0.3);
    quizConf.endurance = 0.8;

    const video = vec(90);
    const quiz = vec(30);
    const merged = mergeByConfidence(
      { metrics: video, confidence: videoConf },
      { metrics: quiz, confidence: quizConf },
    );
    expect(merged.metrics.endurance).toBeLessThan(45); // quiz-dominated
    expect(merged.metrics.dribbleDensity).toBeGreaterThan(70); // video-dominated
  });

  it("keeps the max confidence per metric and stays in range", () => {
    const merged = mergeByConfidence(
      { metrics: vec(100), confidence: conf(0.7) },
      { metrics: vec(0), confidence: conf(0.2) },
    );
    for (const k of METRIC_KEYS) {
      expect(merged.confidence[k]).toBe(0.7);
      expect(merged.metrics[k]).toBeGreaterThanOrEqual(0);
      expect(merged.metrics[k]).toBeLessThanOrEqual(100);
    }
  });
});
