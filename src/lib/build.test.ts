import { describe, expect, it } from "vitest";
import { METRIC_KEYS, type MetricVector } from "./metrics";
import {
  BUILD_BUDGET,
  BUILD_FLOOR,
  BUILD_MAX,
  buildOverall,
  buildRemaining,
  defaultBuild,
  validateBuild,
} from "./build";

function vec(n: number): MetricVector {
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, n])) as MetricVector;
}

describe("player build rules", () => {
  it("default build is valid and leaves little on the table", () => {
    const b = defaultBuild();
    expect(validateBuild(b).ok).toBe(true);
    expect(buildRemaining(b)).toBeGreaterThanOrEqual(0);
    expect(buildRemaining(b)).toBeLessThan(METRIC_KEYS.length);
  });

  it("rejects builds over budget", () => {
    const maxed = vec(BUILD_MAX); // 1188 > 850
    const res = validateBuild(maxed);
    expect(res.ok).toBe(false);
  });

  it("rejects values outside floor/cap and non-integers", () => {
    const low = { ...defaultBuild(), dribbleDensity: BUILD_FLOOR - 1 };
    expect(validateBuild(low).ok).toBe(false);
    const high = { ...defaultBuild(), dribbleDensity: BUILD_MAX + 1 };
    expect(validateBuild(high).ok).toBe(false);
    const frac = { ...defaultBuild(), dribbleDensity: 70.5 };
    expect(validateBuild(frac).ok).toBe(false);
  });

  it("allows a maxed-signature build within budget", () => {
    // 4 signature stats at 99, the rest at floor + leftovers: classic 2K shape.
    const b = vec(BUILD_FLOOR);
    b.dribbleDensity = 99;
    b.explosiveness = 99;
    b.verticalProgression = 99;
    b.finishingInstinct = 99;
    let spare = BUILD_BUDGET - METRIC_KEYS.reduce((s, k) => s + b[k], 0);
    for (const k of METRIC_KEYS) {
      if (b[k] === BUILD_FLOOR && spare > 0) {
        const add = Math.min(spare, 40);
        b[k] += add;
        spare -= add;
      }
    }
    expect(validateBuild(b).ok).toBe(true);
    expect(buildRemaining(b)).toBeGreaterThanOrEqual(0);
  });

  it("OVR rewards on-position builds over off-position builds", () => {
    // Same points: winger stats vs defender stats, rated as a winger.
    const wingerBuild = vec(BUILD_FLOOR);
    wingerBuild.dribbleDensity = 99;
    wingerBuild.explosiveness = 99;
    wingerBuild.verticalProgression = 99;

    const defenderBuild = vec(BUILD_FLOOR);
    defenderBuild.defensivePositioning = 99;
    defenderBuild.duelAggression = 99;
    defenderBuild.scanning = 99;

    expect(buildOverall(wingerBuild, "W")).toBeGreaterThan(buildOverall(defenderBuild, "W"));
    expect(buildOverall(defenderBuild, "CB")).toBeGreaterThan(buildOverall(wingerBuild, "CB"));
  });
});
