import { describe, expect, it } from "vitest";
import { shouldLeaveNote } from "./coach";
import { computeMilwordyStats } from "@/lib/milwordy/math";

const stats = (over: { totalWords: number; today?: string; startDate?: string; targetWords?: number }) =>
  computeMilwordyStats({
    targetWords: over.targetWords ?? 365_000,
    totalWords: over.totalWords,
    today: over.today ?? "2026-07-02", // day 183 of a Jan-1 start
    startDate: over.startDate ?? "2026-01-01",
  });

describe("shouldLeaveNote", () => {
  it("leaves a note when behind pace", () => {
    expect(
      shouldLeaveNote({ stats: stats({ totalWords: 100_000 }), hasNoteToday: false })
    ).toBe(true);
  });

  it("stays quiet when on or ahead of pace", () => {
    expect(
      shouldLeaveNote({ stats: stats({ totalWords: 183_000 }), hasNoteToday: false })
    ).toBe(false);
    expect(
      shouldLeaveNote({ stats: stats({ totalWords: 250_000 }), hasNoteToday: false })
    ).toBe(false);
  });

  it("never leaves two notes in a day", () => {
    expect(
      shouldLeaveNote({ stats: stats({ totalWords: 100_000 }), hasNoteToday: true })
    ).toBe(false);
  });

  it("stays quiet before the challenge starts", () => {
    expect(
      shouldLeaveNote({
        stats: stats({ totalWords: 0, startDate: "2026-09-01" }),
        hasNoteToday: false,
      })
    ).toBe(false);
  });

  it("stays quiet once the target is reached", () => {
    expect(
      shouldLeaveNote({
        stats: stats({ totalWords: 400_000, targetWords: 365_000 }),
        hasNoteToday: false,
      })
    ).toBe(false);
  });
});
