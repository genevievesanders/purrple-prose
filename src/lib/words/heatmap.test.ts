import { describe, expect, it } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  buildHeatmapGrid,
  goalThresholds,
  levelFor,
} from "./heatmap";

describe("levelFor", () => {
  it("grades against thresholds", () => {
    expect(levelFor(0, DEFAULT_THRESHOLDS)).toBe(0);
    expect(levelFor(1, DEFAULT_THRESHOLDS)).toBe(1);
    expect(levelFor(499, DEFAULT_THRESHOLDS)).toBe(1);
    expect(levelFor(500, DEFAULT_THRESHOLDS)).toBe(2);
    expect(levelFor(1500, DEFAULT_THRESHOLDS)).toBe(3);
    expect(levelFor(9999, DEFAULT_THRESHOLDS)).toBe(4);
  });
});

describe("goalThresholds", () => {
  it("centers level 3 on the daily target", () => {
    const [t1, t2, t3, t4] = goalThresholds(365_000, 2026);
    expect(t1).toBe(1);
    expect(t2).toBe(500);
    expect(t3).toBe(1000);
    expect(t4).toBe(2000);
  });
});

describe("buildHeatmapGrid", () => {
  const grid = buildHeatmapGrid({
    year: 2026,
    counts: { "2026-01-01": 100, "2026-07-11": 2000 },
    today: "2026-07-11",
  });

  it("covers the full year", () => {
    const cells = grid.weeks.flat().filter(Boolean);
    expect(cells.length).toBe(365);
  });

  it("pads the first week to Jan 1's weekday", () => {
    // 2026-01-01 is a Thursday → 4 leading nulls (Sun..Wed)
    expect(grid.weeks[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid.weeks[0][4]?.date).toBe("2026-01-01");
  });

  it("grades cells and marks the future", () => {
    const cells = grid.weeks.flat().filter(Boolean);
    const jan1 = cells.find((c) => c!.date === "2026-01-01")!;
    const today = cells.find((c) => c!.date === "2026-07-11")!;
    const dec = cells.find((c) => c!.date === "2026-12-25")!;
    expect(jan1.level).toBe(1);
    expect(today.level).toBe(3);
    expect(dec.future).toBe(true);
    expect(dec.level).toBe(0);
  });

  it("emits 12 month labels", () => {
    expect(grid.monthLabels.map((m) => m.label)).toEqual([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]);
  });
});
