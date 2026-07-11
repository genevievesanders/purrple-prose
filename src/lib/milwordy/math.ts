/**
 * Milwordy math — pure functions over (goal, words written, dates).
 * The challenge runs one year from its start date (anniversary-based, so a
 * window containing Feb 29 gets 366 days). All dates are YYYY-MM-DD strings
 * treated as whole calendar days; day 1 is the start date itself.
 */

export type MilwordyStats = {
  /** Words written inside the challenge window so far. */
  totalWords: number;
  /** False until the start date arrives. */
  started: boolean;
  /** Total days in the challenge window (365 or 366). */
  totalDays: number;
  /** Days elapsed, counting today as a full day. 0 if not started. */
  elapsedDays: number;
  /** Last day of the challenge, YYYY-MM-DD (exclusive end - 1). */
  endDate: string;
  /** Words per elapsed day, averaged. */
  pace: number;
  /** Words you "should" have by today for an even pace toward the target. */
  expectedToDate: number;
  /** totalWords - expectedToDate; positive = ahead. */
  aheadBy: number;
  /** Window-end total if the current pace holds. */
  projectedTotal: number;
  /**
   * ISO date (YYYY-MM-DD) the target is reached at the current pace.
   * Null when there is no meaningful date: not started, pace is 0, or the
   * projection lands beyond a year past the challenge end.
   */
  projectedFinish: string | null;
  /** True when the target won't be reached within the horizon. */
  finishBeyondHorizon: boolean;
  /** Words per remaining day needed to hit the target by the end date. */
  requiredPace: number;
  /** 0..1, capped at 1. */
  progress: number;
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

export function addDays(date: string, days: number): string {
  return toISO(toUTC(date) + days * 86_400_000);
}

/** Same date next year (Feb 29 rolls to Mar 1). */
export function addYears(date: string, years: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return toISO(Date.UTC(y + years, m - 1, d));
}

/** 1-based day of year for a YYYY-MM-DD string. */
export function dayOfYear(date: string): number {
  return daysBetween(`${date.slice(0, 4)}-01-01`, date) + 1;
}

export function computeMilwordyStats(input: {
  targetWords: number;
  totalWords: number;
  /** Today, as YYYY-MM-DD in the user's local time. */
  today: string;
  /** Challenge start, YYYY-MM-DD. */
  startDate: string;
}): MilwordyStats {
  const { targetWords, totalWords, today, startDate } = input;

  const endExclusive = addYears(startDate, 1);
  const totalDays = daysBetween(startDate, endExclusive);
  const endDate = addDays(endExclusive, -1);

  const started = today >= startDate;
  const elapsed = started
    ? Math.min(daysBetween(startDate, today) + 1, totalDays)
    : 0;
  const remaining = totalDays - elapsed;

  const pace = elapsed > 0 ? totalWords / elapsed : 0;
  const expectedToDate = Math.round((targetWords * elapsed) / totalDays);
  const aheadBy = totalWords - expectedToDate;
  const projectedTotal = Math.round(pace * totalDays);

  // A projection more than a year past the challenge end is noise — and
  // Date.toISOString() switches to "+012333-…" for 5-digit years anyway.
  const horizon = toUTC(addYears(startDate, 2));
  let projectedFinish: string | null = null;
  let finishBeyondHorizon = false;
  if (totalWords >= targetWords) {
    projectedFinish = today;
  } else if (pace > 0) {
    const daysToTarget = Math.ceil(targetWords / pace);
    const finishMs = toUTC(startDate) + (daysToTarget - 1) * 86_400_000;
    if (finishMs <= horizon) {
      projectedFinish = toISO(finishMs);
    } else {
      finishBeyondHorizon = true;
    }
  } else if (started) {
    finishBeyondHorizon = true; // started, pace 0, target not reached
  }

  const requiredPace =
    remaining > 0 ? Math.max(0, (targetWords - totalWords) / remaining) : 0;

  return {
    totalWords,
    started,
    totalDays,
    elapsedDays: elapsed,
    endDate,
    pace,
    expectedToDate,
    aheadBy,
    projectedTotal,
    projectedFinish,
    finishBeyondHorizon,
    requiredPace,
    progress: Math.min(1, targetWords > 0 ? totalWords / targetWords : 0),
  };
}
