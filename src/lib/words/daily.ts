/**
 * Words credited to a day when an entry goes from `oldCount` to `newCount`.
 *
 * Only positive deltas count: deleting 100 words then writing 100 new ones
 * credits 100 written — we track "words written", not net document growth.
 * Deletions never subtract from a day's total.
 */
export function dailyDelta(oldCount: number, newCount: number): number {
  return Math.max(0, newCount - oldCount);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a client-supplied local calendar date ("YYYY-MM-DD").
 * The *writer's* local day decides which heatmap cell a word lands in,
 * so the client sends its date rather than the server assuming UTC.
 * Falls back to the server's UTC date when missing/malformed.
 */
export function resolveWritingDate(clientDate: unknown, now: Date): string {
  if (typeof clientDate === "string" && DATE_RE.test(clientDate)) {
    const parsed = new Date(`${clientDate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      // Reject dates wildly out of range (clock tampering / bugs): accept
      // within ±2 days of server time.
      const diff = Math.abs(parsed.getTime() - now.getTime());
      if (diff <= 3 * 24 * 60 * 60 * 1000) return clientDate;
    }
  }
  return now.toISOString().slice(0, 10);
}
