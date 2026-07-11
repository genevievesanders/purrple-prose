import { prisma } from "./client";

/** Daily word counts for a user's calendar year, as date → words. */
export async function getDailyCounts(
  userId: string,
  year: number
): Promise<Record<string, number>> {
  const rows = await prisma.dailyWordCount.findMany({
    where: {
      userId,
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    select: { date: true, words: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.date.toISOString().slice(0, 10)] = row.words;
  }
  return counts;
}

/** Total words in a date window (inclusive), e.g. a milwordy challenge. */
export async function getWordsInRange(
  userId: string,
  from: string, // YYYY-MM-DD
  to: string
): Promise<number> {
  const result = await prisma.dailyWordCount.aggregate({
    _sum: { words: true },
    where: {
      userId,
      date: {
        gte: new Date(`${from}T00:00:00Z`),
        lte: new Date(`${to}T00:00:00Z`),
      },
    },
  });
  return result._sum.words ?? 0;
}

export function getMilwordyGoal(userId: string) {
  return prisma.milwordyGoal.findUnique({ where: { userId } });
}

export function upsertMilwordyGoal(
  userId: string,
  data: { targetWords: number; startDate: string } // YYYY-MM-DD
) {
  const startDate = new Date(`${data.startDate}T00:00:00Z`);
  return prisma.milwordyGoal.upsert({
    where: { userId },
    create: { userId, targetWords: data.targetWords, startDate },
    update: { targetWords: data.targetWords, startDate },
  });
}

export function deleteMilwordyGoal(userId: string) {
  return prisma.milwordyGoal.deleteMany({ where: { userId } });
}
