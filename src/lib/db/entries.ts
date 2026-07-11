import { prisma } from "./client";
import { countWords } from "@/lib/words/count";
import { dailyDelta } from "@/lib/words/daily";
import { reindexEntry } from "@/lib/agents/memory/store";

/**
 * Entry repository. Every function takes `userId` as its first argument and
 * scopes every query with it — there is no unscoped path to another user's
 * entries. Callers get userId from `requireUserId()` only.
 */

export function listEntries(userId: string) {
  return prisma.entry.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      wordCount: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export function getEntry(userId: string, id: string) {
  return prisma.entry.findFirst({ where: { id, userId } });
}

export function createEntry(userId: string) {
  return prisma.entry.create({ data: { userId } });
}

export async function deleteEntry(userId: string, id: string) {
  // deleteMany so the userId scope applies (delete throws on 0 rows only
  // via count check by the caller if it cares).
  await prisma.entry.deleteMany({ where: { id, userId } });
}

/**
 * Save an entry's title/content, recomputing its word count and crediting
 * the positive delta to the user's daily ledger — atomically.
 */
export async function saveEntry(
  userId: string,
  id: string,
  data: { title: string; content: string },
  writingDate: string // YYYY-MM-DD
): Promise<{ wordCount: number } | null> {
  const wordCount = countWords(data.content);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.entry.findFirst({
      where: { id, userId },
      select: { wordCount: true },
    });
    if (!existing) return null;

    await tx.entry.update({
      where: { id },
      data: { title: data.title, content: data.content, wordCount },
    });

    const delta = dailyDelta(existing.wordCount, wordCount);
    if (delta > 0) {
      const date = new Date(`${writingDate}T00:00:00Z`);
      await tx.dailyWordCount.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, words: delta },
        update: { words: { increment: delta } },
      });
    }

    return { wordCount };
  });

  if (result) {
    // Keep the lore bible current. Cheap (hashed embeddings) and best-effort:
    // an indexing failure must never fail a save.
    try {
      await reindexEntry(userId, id, data.content);
    } catch (err) {
      console.warn("[lore] reindex failed:", err);
    }
  }

  return result;
}
