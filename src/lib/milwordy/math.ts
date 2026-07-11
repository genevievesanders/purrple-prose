/**
 * Milwordy math — pure functions over (goal, words written, date).
 * All dates are treated as calendar days in the user's year; fractions of a
 * day are ignored (day 1 = Jan 1).
 */

export type MilwordyStats = {
  /** Total words written this year so far. */
  totalWords: number;
  /** Words per elapsed day, averaged. */
  pace: number;
  /** Words you "should" have by today for an even pace toward the target. */
  expectedToDate: number;
  /** totalWords - expectedToDate; positive = ahead. */
  aheadBy: number;
  /** Year-end total if the current pace holds. */
  projectedTotal: number;
  /**
   * ISO date (YYYY-MM-DD) the target is reached at the current pace.
   * Null when there is no meaningful date: pace is 0, or the projection
   * lands beyond the end of next year (see finishBeyondHorizon).
   */
  projectedFinish: string | null;
  /** True when the target won't be reached within this year or the next. */
  finishBeyondHorizon: boolean;
  /** Words per remaining day needed to hit the target by Dec 31. */
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

/** 1-based day of year for a YYYY-MM-DD string. */
export function dayOfYear(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const start = Date.UTC(y, 0, 1);
  const current = Date.UTC(y, m - 1, d);
  return Math.round((current - start) / 86_400_000) + 1;
}

export function computeMilwordyStats(input: {
  targetWords: number;
  totalWords: number;
  /** Today, as YYYY-MM-DD in the user's local time. */
  today: string;
}): MilwordyStats {
  const { targetWords, totalWords, today } = input;
  const year = Number(today.slice(0, 4));
  const totalDays = daysInYear(year);
  const elapsed = dayOfYear(today); // counts today as a full day
  const remaining = totalDays - elapsed;

  const pace = totalWords / elapsed;
  const expectedToDate = Math.round((targetWords * elapsed) / totalDays);
  const aheadBy = totalWords - expectedToDate;
  const projectedTotal = Math.round(pace * totalDays);

  // A projection past the end of next year is noise, not a date — and
  // Date.toISOString() switches to "+012333-…" for 5-digit years anyway.
  const horizon = Date.UTC(year + 1, 11, 31);
  let projectedFinish: string | null = null;
  let finishBeyondHorizon = false;
  if (totalWords >= targetWords) {
    projectedFinish = today;
  } else if (pace > 0) {
    const daysToTarget = Math.ceil(targetWords / pace);
    const finishMs = Date.UTC(year, 0, daysToTarget);
    if (finishMs <= horizon) {
      projectedFinish = new Date(finishMs).toISOString().slice(0, 10);
    } else {
      finishBeyondHorizon = true;
    }
  } else {
    finishBeyondHorizon = true; // pace 0 and target not reached
  }

  const requiredPace =
    remaining > 0 ? Math.max(0, (targetWords - totalWords) / remaining) : 0;

  return {
    totalWords,
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
