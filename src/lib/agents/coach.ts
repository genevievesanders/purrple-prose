import { prisma } from "@/lib/db/client";
import { getWordsInRange } from "@/lib/db/progress";
import { computeMilwordyStats, type MilwordyStats } from "@/lib/milwordy/math";
import { runTask } from "./orchestrator";

/**
 * The milwordy coach: a scheduled sweep that leaves an encouraging note
 * ("the cat left something while you slept") for writers who've fallen
 * behind pace. Idempotent — at most one note per user per local day,
 * enforced by both the decision function and the DB unique constraint.
 */

export function shouldLeaveNote(input: {
  stats: MilwordyStats;
  hasNoteToday: boolean;
}): boolean {
  const { stats, hasNoteToday } = input;
  if (hasNoteToday) return false;
  if (!stats.started) return false;
  if (stats.progress >= 1) return false; // already won
  return stats.aheadBy < 0;
}

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Run one coach pass over every opted-in user. Returns notes created. */
export async function runCoachSweep(): Promise<number> {
  const today = todayLocalISO();
  const date = new Date(`${today}T00:00:00Z`);
  const goals = await prisma.milwordyGoal.findMany();
  let created = 0;

  for (const goal of goals) {
    try {
      const startDate = goal.startDate.toISOString().slice(0, 10);
      const stats = computeMilwordyStats({
        targetWords: goal.targetWords,
        totalWords: await getWordsInRange(
          goal.userId,
          startDate,
          today < startDate ? startDate : today
        ),
        today,
        startDate,
      });
      const existing = await prisma.coachNote.findUnique({
        where: { userId_date: { userId: goal.userId, date } },
      });

      if (!shouldLeaveNote({ stats, hasNoteToday: !!existing })) continue;

      const wordsToday = await getWordsInRange(goal.userId, today, today);
      const text = await runTask(goal.userId, {
        kind: "coach-note",
        pace: {
          targetWords: goal.targetWords,
          behindBy: -stats.aheadBy,
          requiredPace: stats.requiredPace,
          wordsToday,
        },
      });

      // Unique constraint makes concurrent sweeps safe.
      await prisma.coachNote.upsert({
        where: { userId_date: { userId: goal.userId, date } },
        create: { userId: goal.userId, date, text },
        update: {},
      });
      created++;
    } catch (err) {
      console.warn(`[coach] sweep failed for user ${goal.userId}:`, err);
    }
  }

  return created;
}

/** Latest unread note for the "the cat left something" surface. */
export function getUnreadNote(userId: string) {
  return prisma.coachNote.findFirst({
    where: { userId, readAt: null },
    orderBy: { date: "desc" },
  });
}

export async function markNoteRead(userId: string, id: string) {
  await prisma.coachNote.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}
