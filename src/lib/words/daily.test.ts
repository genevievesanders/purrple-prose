import { describe, expect, it } from "vitest";
import { dailyDelta, resolveWritingDate } from "./daily";

describe("dailyDelta", () => {
  it("credits growth", () => {
    expect(dailyDelta(100, 150)).toBe(50);
  });

  it("ignores shrinkage", () => {
    expect(dailyDelta(150, 100)).toBe(0);
  });

  it("handles a fresh entry", () => {
    expect(dailyDelta(0, 42)).toBe(42);
  });

  it("no change → no credit", () => {
    expect(dailyDelta(7, 7)).toBe(0);
  });
});

describe("resolveWritingDate", () => {
  const now = new Date("2026-07-11T20:00:00Z");

  it("accepts a valid client date near server time", () => {
    expect(resolveWritingDate("2026-07-11", now)).toBe("2026-07-11");
    // Client just across midnight in its own timezone:
    expect(resolveWritingDate("2026-07-12", now)).toBe("2026-07-12");
    expect(resolveWritingDate("2026-07-10", now)).toBe("2026-07-10");
  });

  it("rejects malformed input", () => {
    expect(resolveWritingDate("tomorrow", now)).toBe("2026-07-11");
    expect(resolveWritingDate(null, now)).toBe("2026-07-11");
    expect(resolveWritingDate("2026-13-45", now)).toBe("2026-07-11");
  });

  it("rejects dates far from server time", () => {
    expect(resolveWritingDate("2025-01-01", now)).toBe("2026-07-11");
    expect(resolveWritingDate("2026-07-20", now)).toBe("2026-07-11");
  });
});
