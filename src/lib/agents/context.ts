import { prisma } from "@/lib/db/client";

/** What the agents know about the writer when a task runs. */
export type WritingContext = {
  recentTitles: string[];
  wordsToday: number;
};

const DRAFT_CHAR_LIMIT = 8_000;

export async function getWritingContext(
  userId: string
): Promise<WritingContext> {
  const today = new Date();
  const date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [recent, daily] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { title: true },
    }),
    prisma.dailyWordCount.findUnique({
      where: { userId_date: { userId, date } },
      select: { words: true },
    }),
  ]);

  return {
    recentTitles: recent.map((e) => e.title),
    wordsToday: daily?.words ?? 0,
  };
}

/** Truncate a draft for prompt inclusion, keeping the head and tail. */
export function excerptDraft(content: string): string {
  if (content.length <= DRAFT_CHAR_LIMIT) return content;
  const half = DRAFT_CHAR_LIMIT / 2;
  return `${content.slice(0, half)}\n\n[… middle of draft omitted …]\n\n${content.slice(-half)}`;
}

export function describeContext(ctx: WritingContext): string {
  const titles =
    ctx.recentTitles.length > 0
      ? `Recent story titles: ${ctx.recentTitles.map((t) => `"${t}"`).join(", ")}.`
      : "No stories yet — a blank page.";
  return `${titles} Words written today: ${ctx.wordsToday}.`;
}
