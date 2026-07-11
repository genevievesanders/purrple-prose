import { describe, expect, it } from "vitest";
import { chunkText } from "./chunker";

const para = (n: number, len = 200) =>
  `Paragraph ${n} ${"word ".repeat(Math.ceil(len / 5))}`.trim();

describe("chunkText", () => {
  it("returns nothing for empty/tiny text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("Hi.")).toEqual([]);
  });

  it("keeps a short entry as one chunk", () => {
    const text = `${para(1)}\n\n${para(2)}`;
    expect(chunkText(text)).toHaveLength(1);
  });

  it("splits on paragraph boundaries near the target size", () => {
    const text = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => para(n, 300)).join("\n\n");
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1500);
    // No content lost (modulo separators)
    expect(chunks.join(" ")).toContain("Paragraph 10");
  });

  it("hard-splits a single monster paragraph", () => {
    const chunks = chunkText("x".repeat(4000));
    expect(chunks.length).toBeGreaterThan(2);
  });
});
