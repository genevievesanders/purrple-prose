import { describe, expect, it } from "vitest";
import { EMBEDDING_DIM, HashedNgramEmbedder } from "./embeddings";

const cosine = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + v * b[i], 0);

describe("HashedNgramEmbedder", () => {
  const e = new HashedNgramEmbedder();

  it("produces normalized vectors of the right dimension", async () => {
    const v = await e.embed("The lantern hissed in the salt wind.");
    expect(v).toHaveLength(EMBEDDING_DIM);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("is deterministic", async () => {
    const a = await e.embed("Mira's eyes were green.");
    const b = await e.embed("Mira's eyes were green.");
    expect(a).toEqual(b);
  });

  it("ranks lexically-related text above unrelated text", async () => {
    const query = await e.embed("What color are Mira's eyes?");
    const related = await e.embed(
      "Mira laughed, her green eyes catching the light of the harbor."
    );
    const unrelated = await e.embed(
      "The spreadsheet listed quarterly revenue projections for the factory."
    );
    expect(cosine(query, related)).toBeGreaterThan(cosine(query, unrelated));
  });

  it("handles empty text without NaNs", async () => {
    const v = await e.embed("");
    expect(v.every((x) => x === 0)).toBe(true);
  });
});
