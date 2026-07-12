import { prisma } from "./client";
import { countWords } from "@/lib/words/count";
import { dailyDelta } from "@/lib/words/daily";
import { reindexEntry } from "@/lib/agents/memory/store";
import { slugify, uniqueSlug } from "@/lib/entries/slug";

/**
 * Entry repository. Every function takes `userId` as its first argument and
 * scopes every query with it — there is no unscoped path to another user's
 * entries. Callers get userId from `requireUserId()` only.
 */

export type EntrySort = "title" | "created" | "updated" | "words";
export type SortDir = "asc" | "desc";

const SORT_COLUMN = {
  title: "title",
  created: "createdAt",
  updated: "updatedAt",
  words: "wordCount",
} as const;

export function listEntries(
  userId: string,
  opts: { tag?: string; sort?: EntrySort; dir?: SortDir } = {}
) {
  const sort = opts.sort ?? "updated";
  const dir = opts.dir ?? (sort === "title" ? "asc" : "desc");
  return prisma.entry.findMany({
    where: {
      userId,
      ...(opts.tag ? { tags: { has: opts.tag } } : {}),
    },
    orderBy: { [SORT_COLUMN[sort]]: dir },
    select: {
      id: true,
      slug: true,
      title: true,
      tags: true,
      wordCount: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

/** Look up by slug first, then id — old id URLs keep working. */
export function getEntryBySlugOrId(userId: string, slugOrId: string) {
  return prisma.entry.findFirst({
    where: { userId, OR: [{ slug: slugOrId }, { id: slugOrId }] },
  });
}

export function createEntry(userId: string) {
  return prisma.entry.create({ data: { userId } });
}

export async function deleteEntry(userId: string, id: string) {
  // deleteMany so the userId scope applies.
  await prisma.entry.deleteMany({ where: { id, userId } });
}

/** Compute this entry's slug, avoiding the user's other slugs. */
async function computeSlug(
  userId: string,
  entryId: string,
  title: string
): Promise<string | null> {
  const base = slugify(title);
  if (!base) return null;
  const others = await prisma.entry.findMany({
    where: { userId, id: { not: entryId }, slug: { not: null } },
    select: { slug: true },
  });
  return uniqueSlug(base, new Set(others.map((e) => e.slug!)));
}

/**
 * Save an entry's title/content/tags, recomputing word count, slug, and
 * crediting the positive delta to the user's daily ledger — atomically.
 */
export async function saveEntry(
  userId: string,
  id: string,
  data: { title: string; content: string; tags: string[] },
  writingDate: string // YYYY-MM-DD
): Promise<{ wordCount: number; slug: string | null } | null> {
  const wordCount = countWords(data.content);
  const slug = await computeSlug(userId, id, data.title);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.entry.findFirst({
      where: { id, userId },
      select: { wordCount: true },
    });
    if (!existing) return null;

    await tx.entry.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        slug,
        wordCount,
      },
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

    return { wordCount, slug };
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
