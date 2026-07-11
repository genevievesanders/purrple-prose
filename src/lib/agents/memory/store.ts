import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { chunkText } from "./chunker";
import { getEmbedder } from "./embeddings";

/**
 * The lore bible store. THE isolation rule of the app lives here: every
 * statement filters by userId, and callers cannot construct a query that
 * doesn't. Vectors go through raw SQL because Prisma can't parameterize
 * pgvector columns.
 */

export type LoreHit = {
  entryId: string;
  entryTitle: string;
  seq: number;
  text: string;
  /** Cosine similarity in [0,1]-ish (hashed embeddings are non-negative). */
  similarity: number;
};

function toVectorLiteral(v: number[]): string {
  return `[${v.map((x) => x.toFixed(6)).join(",")}]`;
}

/** Re-index one entry's chunks (delete + insert, transactional). */
export async function reindexEntry(
  userId: string,
  entryId: string,
  content: string
): Promise<number> {
  const embedder = getEmbedder();
  const chunks = chunkText(content);
  const embedded = await Promise.all(
    chunks.map(async (text, seq) => ({
      seq,
      text,
      vector: toVectorLiteral(await embedder.embed(text)),
    }))
  );

  await prisma.$transaction(async (tx) => {
    // Scoped delete: entry must belong to the user.
    await tx.$executeRaw`
      DELETE FROM "EntryChunk"
      WHERE "entryId" = ${entryId} AND "userId" = ${userId}`;
    for (const c of embedded) {
      await tx.$executeRaw`
        INSERT INTO "EntryChunk" ("id", "userId", "entryId", "seq", "text", "embedding")
        SELECT ${crypto.randomUUID()}, ${userId}, ${entryId}, ${c.seq}, ${c.text}, ${c.vector}::vector
        WHERE EXISTS (
          SELECT 1 FROM "Entry" WHERE "id" = ${entryId} AND "userId" = ${userId}
        )`;
    }
  });

  return embedded.length;
}

/**
 * Retrieve the user's most relevant lore for a query text.
 * excludeEntryId lets continuity checks search only *other* entries.
 */
export async function searchLore(
  userId: string,
  queryText: string,
  opts: { k?: number; excludeEntryId?: string } = {}
): Promise<LoreHit[]> {
  const k = opts.k ?? 5;
  const vector = toVectorLiteral(await getEmbedder().embed(queryText));

  const exclude = opts.excludeEntryId
    ? Prisma.sql`AND c."entryId" <> ${opts.excludeEntryId}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    { entryId: string; entryTitle: string; seq: number; text: string; similarity: number }[]
  >(Prisma.sql`
    SELECT c."entryId"                        AS "entryId",
           e."title"                          AS "entryTitle",
           c."seq"                            AS "seq",
           c."text"                           AS "text",
           1 - (c."embedding" <=> ${vector}::vector) AS "similarity"
    FROM "EntryChunk" c
    JOIN "Entry" e ON e."id" = c."entryId"
    WHERE c."userId" = ${userId}
    ${exclude}
    ORDER BY c."embedding" <=> ${vector}::vector
    LIMIT ${k}`);

  return rows;
}

/** Chunk count for a user — used by the panel's lore view. */
export async function loreSize(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM "EntryChunk" WHERE "userId" = ${userId}`;
  return Number(rows[0]?.n ?? 0);
}
