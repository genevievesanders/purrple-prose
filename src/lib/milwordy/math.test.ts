import { describe, expect, it } from "vitest";
import {
  addDays,
  addYears,
  computeMilwordyStats,
  dayOfYear,
  daysBetween,
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

  it("days in year and arithmetic", () => {
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(2024)).toBe(366);
    expect(daysBetween("2026-01-01", "2026-01-02")).toBe(1);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addYears("2026-06-15", 1)).toBe("2027-06-15");
    expect(addYears("2024-02-29", 1)).toBe("2025-03-01"); // rolls over
  });
});

describe("computeMilwordyStats — calendar-year start", () => {
  it("day 1: everything projects from the first day", () => {
    const s = computeMilwordyStats({
      targetWords: 365_000,
      totalWords: 2_000,
      today: "2026-01-01",
      startDate: "2026-01-01",
    });
    expect(s.started).toBe(true);
    expect(s.elapsedDays).toBe(1);
    expect(s.pace).toBe(2000);
    expect(s.expectedToDate).toBe(1000);
    expect(s.aheadBy).toBe(1000);
    expect(s.projectedTotal).toBe(730_000);
  });

  it("exactly on pace at mid-year", () => {
    // 2026-07-02 is day 183 of a 365-day window from Jan 1
    const s = computeMilwordyStats({
      targetWords: 365_000,
      totalWords: 183_000,
      today: "2026-07-02",
      startDate: "2026-01-01",
    });
    expect(s.pace).toBe(1000);
    expect(s.expectedToDate).toBe(183_000);
    expect(s.aheadBy).toBe(0);
    expect(s.projectedTotal).toBe(365_000);
    expect(s.projectedFinish).toBe("2026-12-31");
    expect(s.endDate).toBe("2026-12-31");
    expect(s.requiredPace).toBeCloseTo(1000, 5);
  });

  it("far behind pace: projection beyond the horizon", () => {
    const s = computeMilwordyStats({
      targetWords: 1_000_000,
      totalWords: 100_000,
      today: "2026-07-02",
      startDate: "2026-01-01",
    });
    expect(s.aheadBy).toBeLessThan(0);
    expect(s.projectedFinish).toBeNull();
    expect(s.finishBeyondHorizon).toBe(true);
    expect(s.requiredPace).toBeCloseTo(900_000 / 182, 3);
  });

  it("slightly behind: finish lands past the end with a real date", () => {
    const s = computeMilwordyStats({
      targetWords: 200_000,
      totalWords: 100_000,
      today: "2026-07-02",
      startDate: "2026-01-01",
    });
    expect(s.finishBeyondHorizon).toBe(false);
    expect(s.projectedFinish).toBe("2027-01-01");
  });

  it("target already reached", () => {
    const s = computeMilwordyStats({
      targetWords: 50_000,
      totalWords: 60_000,
      today: "2026-11-11",
      startDate: "2026-01-01",
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
      startDate: "2026-01-01",
    });
    expect(s.pace).toBe(0);
    expect(s.projectedFinish).toBeNull();
    expect(s.finishBeyondHorizon).toBe(true);
    expect(s.progress).toBe(0);
  });

  it("final day: remaining is 0, no division blowup", () => {
    const s = computeMilwordyStats({
      targetWords: 1_000_000,
      totalWords: 999_999,
      today: "2026-12-31",
      startDate: "2026-01-01",
    });
    expect(s.requiredPace).toBe(0);
    expect(Number.isFinite(s.pace)).toBe(true);
  });
});

describe("computeMilwordyStats — custom start dates", () => {
  it("mid-year start counts elapsed days from the start date", () => {
    const s = computeMilwordyStats({
      targetWords: 365_000,
      totalWords: 41_000,
      today: "2026-07-11",
      startDate: "2026-06-01",
    });
    expect(s.elapsedDays).toBe(41);
    expect(s.pace).toBe(1000);
    expect(s.endDate).toBe("2027-05-31");
    expect(s.expectedToDate).toBe(41_000);
    expect(s.aheadBy).toBe(0);
  });

  it("window containing Feb 29 has 366 days", () => {
    const s = computeMilwordyStats({
      targetWords: 366_000,
      totalWords: 1_000,
      today: "2027-06-01",
      startDate: "2027-06-01", // window spans Feb 29, 2028
    });
    expect(s.totalDays).toBe(366);
    expect(s.endDate).toBe("2028-05-31");
  });

  it("future start date: not started yet", () => {
    const s = computeMilwordyStats({
      targetWords: 1_000_000,
      totalWords: 0,
      today: "2026-07-11",
      startDate: "2026-09-01",
    });
    expect(s.started).toBe(false);
    expect(s.elapsedDays).toBe(0);
    expect(s.pace).toBe(0);
    expect(s.expectedToDate).toBe(0);
    expect(s.projectedFinish).toBeNull();
    expect(s.finishBeyondHorizon).toBe(false);
  });
});
