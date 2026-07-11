import { describe, expect, it } from "vitest";
import {
  computeMilwordyStats,
  dayOfYear,
  daysInYear,
  isLeapYear,
} from "./math";

describe("calendar helpers", () => {
  it("identifies leap years", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it("day of year", () => {
    expect(dayOfYear("2026-01-01")).toBe(1);
    expect(dayOfYear("2026-12-31")).toBe(365);
    expect(dayOfYear("2024-12-31")).toBe(366);
    expect(dayOfYear("2026-07-11")).toBe(192);
  });

  it("days in year", () => {
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(2024)).toBe(366);
  });
});

describe("computeMilwordyStats", () => {
  it("day 1: everything projects from the first day", () => {
    const s = computeMilwordyStats({
      targetWords: 365_000,
      totalWords: 2_000,
      today: "2026-01-01",
    });
    expect(s.pace).toBe(2000);
    expect(s.expectedToDate).toBe(1000); // 365000/365
    expect(s.aheadBy).toBe(1000);
    expect(s.projectedTotal).toBe(730_000);
  });

  it("exactly on pace at mid-year", () => {
    // 2026-07-02 is day 183 (of 365)
    const s = computeMilwordyStats({
      targetWords: 365_000,
      totalWords: 183_000,
      today: "2026-07-02",
    });
    expect(s.pace).toBe(1000);
    expect(s.expectedToDate).toBe(183_000);
    expect(s.aheadBy).toBe(0);
    expect(s.projectedTotal).toBe(365_000);
    expect(s.projectedFinish).toBe("2026-12-31");
    expect(s.requiredPace).toBeCloseTo(1000, 5);
  });

  it("behind pace", () => {
    const s = computeMilwordyStats({
      targetWords: 1_000_000,
      totalWords: 100_000,
      today: "2026-07-02", // day 183
    });
    expect(s.aheadBy).toBeLessThan(0);
    // pace ≈ 546.4/day → ~1830 days to target → beyond the horizon
    expect(s.projectedFinish).toBeNull();
    expect(s.finishBeyondHorizon).toBe(true);
    // required pace to still make it: 900k over 182 remaining days
    expect(s.requiredPace).toBeCloseTo(900_000 / 182, 3);
  });

  it("slightly behind: finish lands next year with a real date", () => {
    // 100k done by day 183, 200k target → pace ≈ 546.4/day → ~366 days
    const s = computeMilwordyStats({
      targetWords: 200_000,
      totalWords: 100_000,
      today: "2026-07-02",
    });
    expect(s.finishBeyondHorizon).toBe(false);
    expect(s.projectedFinish).toBe("2027-01-01");
  });

  it("target already reached", () => {
    const s = computeMilwordyStats({
      targetWords: 50_000,
      totalWords: 60_000,
      today: "2026-11-11",
    });
    expect(s.projectedFinish).toBe("2026-11-11");
    expect(s.progress).toBe(1);
    expect(s.requiredPace).toBe(0);
  });

  it("zero words: no projected finish", () => {
    const s = computeMilwordyStats({
      targetWords: 1_000_000,
      totalWords: 0,
      today: "2026-07-02",
    });
    expect(s.pace).toBe(0);
    expect(s.projectedFinish).toBeNull();
    expect(s.finishBeyondHorizon).toBe(true);
    expect(s.progress).toBe(0);
  });

  it("Dec 31: remaining days is 0, no division blowup", () => {
    const s = computeMilwordyStats({
      targetWords: 1_000_000,
      totalWords: 999_999,
      today: "2026-12-31",
    });
    expect(s.requiredPace).toBe(0);
    expect(Number.isFinite(s.pace)).toBe(true);
  });
});
