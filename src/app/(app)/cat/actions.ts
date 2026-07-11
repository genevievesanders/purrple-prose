"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { getPromptSource } from "@/lib/prompts";
import type { CatPrompt } from "@/lib/prompts";

export async function getCatPromptAction(): Promise<CatPrompt> {
  const userId = await requireUserId();

  const today = new Date();
  const date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [recent, daily] = await Promise.all([
    prisma.entry.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { title: true },
    }),
    prisma.dailyWordCount.findUnique({
      where: { userId_date: { userId, date } },
      select: { words: true },
    }),
  ]);

  return getPromptSource().getPrompt({
    userId,
    recentTitle: recent?.title,
    wordsToday: daily?.words ?? 0,
  });
}
