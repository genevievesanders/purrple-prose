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

export function getMilwordyGoal(userId: string, year: number) {
  return prisma.milwordyGoal.findUnique({
    where: { userId_year: { userId, year } },
  });
}

export function upsertMilwordyGoal(
  userId: string,
  year: number,
  targetWords: number
) {
  return prisma.milwordyGoal.upsert({
    where: { userId_year: { userId, year } },
    create: { userId, year, targetWords },
    update: { targetWords },
  });
}

export function deleteMilwordyGoal(userId: string, year: number) {
  return prisma.milwordyGoal.deleteMany({ where: { userId, year } });
}
