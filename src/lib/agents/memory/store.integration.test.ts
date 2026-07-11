// Integration tests for the lore bible store — require a live Postgres.
// Run locally with: RUN_DB_TESTS=1 npx vitest run src/lib/agents/memory
// Skipped in CI (no database there).
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/client";
import { loreSize, reindexEntry, searchLore } from "./store";

const run = process.env.RUN_DB_TESTS === "1";
const d = describe.skipIf(!run);

const A_EMAIL = "isolation-a@test.local";
const B_EMAIL = "isolation-b@test.local";

async function makeUser(email: string) {
  return prisma.user.create({
    data: { email, name: email, passwordHash: "x" },
  });
}

d("lore store (integration)", () => {
  let userA: { id: string };
  let userB: { id: string };
  let entryA: { id: string };
  let entryB: { id: string };

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [A_EMAIL, B_EMAIL] } } });
    userA = await makeUser(A_EMAIL);
    userB = await makeUser(B_EMAIL);
    entryA = await prisma.entry.create({
      data: {
        userId: userA.id,
        title: "A's secret story",
        content: "Mira has green eyes and lives in the lighthouse at Cape Wren. ".repeat(3),
      },
    });
    entryB = await prisma.entry.create({
      data: {
        userId: userB.id,
        title: "B's story",
        content: "Detective Sorren keeps a brass compass from the war. ".repeat(3),
      },
    });
    await reindexEntry(userA.id, entryA.id, (await prisma.entry.findUniqueOrThrow({ where: { id: entryA.id } })).content);
    await reindexEntry(userB.id, entryB.id, (await prisma.entry.findUniqueOrThrow({ where: { id: entryB.id } })).content);
  });

  afterAll(async () => {
    // Cascade removes entries + chunks.
    await prisma.user.deleteMany({ where: { email: { in: [A_EMAIL, B_EMAIL] } } });
  });

  it("indexes chunks per user", async () => {
    expect(await loreSize(userA.id)).toBeGreaterThan(0);
    expect(await loreSize(userB.id)).toBeGreaterThan(0);
  });

  it("finds a user's own lore by content", async () => {
    const hits = await searchLore(userA.id, "What color are Mira's eyes?");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].text).toContain("green eyes");
    expect(hits[0].entryTitle).toBe("A's secret story");
  });

  it("NEVER returns another user's lore, even for an exact-content query", async () => {
    // B queries with the exact text of A's entry — the strongest possible bait.
    const hits = await searchLore(
      userB.id,
      "Mira has green eyes and lives in the lighthouse at Cape Wren."
    );
    for (const h of hits) {
      expect(h.entryId).not.toBe(entryA.id);
      expect(h.text).not.toContain("Mira");
    }
  });

  it("excludeEntryId hides the current entry (continuity mode)", async () => {
    const hits = await searchLore(userA.id, "Mira lighthouse", {
      excludeEntryId: entryA.id,
    });
    for (const h of hits) expect(h.entryId).not.toBe(entryA.id);
  });

  it("reindexEntry refuses to index into another user's entry", async () => {
    // B tries to write chunks against A's entry id.
    await reindexEntry(userB.id, entryA.id, "poisoned lore ".repeat(10));
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM "EntryChunk"
      WHERE "entryId" = ${entryA.id} AND "userId" = ${userB.id}`;
    expect(Number(rows[0].n)).toBe(0);
    // A's original chunks survive.
    const own = await searchLore(userA.id, "Mira");
    expect(own.some((h) => h.text.includes("green eyes"))).toBe(true);
  });
});
