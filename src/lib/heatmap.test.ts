import { describe, expect, it } from "vitest";
import { METRIC_KEYS, type MetricVector } from "@/lib/metrics";
import { buildHeatMap, densityGrid, estimatedPoints, HEAT_COLS, HEAT_ROWS } from "./heatmap";

function vec(n: number): MetricVector {
  return Object.fromEntries(METRIC_KEYS.map((k) => [k, n])) as MetricVector;
}

/** Density-weighted centre of the map, in 0–100 pitch coordinates. */
function centroid(cells: number[][]) {
  let x = 0, y = 0, t = 0;
  cells.forEach((row, r) =>
    row.forEach((v, c) => {
      x += v * ((c + 0.5) / HEAT_COLS) * 100;
      y += v * ((r + 0.5) / HEAT_ROWS) * 100;
      t += v;
    }),
  );
  return { x: x / t, y: y / t };
}

describe("densityGrid", () => {
  it("is normalised to 0–1 with the peak under the point", () => {
    const cells = densityGrid([{ x: 80, y: 20, weight: 1 }]);
    expect(cells).toHaveLength(HEAT_ROWS);
    expect(cells[0]).toHaveLength(HEAT_COLS);
    const flat = cells.flat();
    expect(Math.max(...flat)).toBe(1);
    expect(Math.min(...flat)).toBeGreaterThanOrEqual(0);
    const c = centroid(cells);
    expect(c.x).toBeGreaterThan(60);
    expect(c.y).toBeLessThan(40);
  });
});

describe("buildHeatMap", () => {
  it("puts strikers high and centre-backs deep", () => {
    const st = centroid(buildHeatMap("ST", "RIGHT", vec(60)).cells);
    const cb = centroid(buildHeatMap("CB", "RIGHT", vec(60)).cells);
    expect(st.x).toBeGreaterThan(70);
    expect(cb.x).toBeLessThan(40);
  });

  it("puts a left-footed fullback on the left flank", () => {
    const map = buildHeatMap("FB", "LEFT", vec(60));
    expect(centroid(map.cells).y).toBeLessThan(35);
    expect(map.zone).toBe("Left flank · middle third");
  });

  it("doesn't guess a winger's side", () => {
    const map = buildHeatMap("W", "RIGHT", vec(60));
    expect(Math.abs(centroid(map.cells).y - 50)).toBeLessThan(5);
    expect(map.zone).toBe("Wide · final third");
  });

  it("creative wingers drift into the half-spaces", () => {
    const plain = estimatedPoints("W", "RIGHT", vec(50));
    const creator = estimatedPoints("W", "RIGHT", { ...vec(50), spatialCreation: 95 });
    const halfSpace = (ps: typeof plain) =>
      ps.filter((p) => p.y >= 25 && p.y <= 75).reduce((s, p) => s + p.weight, 0);
    expect(halfSpace(creator)).toBeGreaterThan(halfSpace(plain));
  });

  it("lists the three strongest traits as tendencies", () => {
    const m = { ...vec(40), dribbleDensity: 90, explosiveness: 85, finishingInstinct: 80 };
    expect(buildHeatMap("W", "RIGHT", m).tendencies).toEqual([
      "Takes defenders on 1v1",
      "Explodes into space with a quick first step",
      "Gets into the box to finish",
    ]);
  });
});
