import { describe, expect, it } from "vitest";
import { countWords } from "./count";

describe("countWords", () => {
  it("returns 0 for empty input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });

  it("counts simple words", () => {
    expect(countWords("The cat sleeps on the page")).toBe(6);
  });

  it("handles punctuation-only tokens", () => {
    expect(countWords("wait — what ...")).toBe(2);
  });

  it("counts contractions and hyphenated words once", () => {
    expect(countWords("it's a well-known fact")).toBe(4);
  });

  it("handles unicode letters", () => {
    expect(countWords("café naïve 日本語")).toBe(3);
  });

  it("handles mixed whitespace and newlines", () => {
    expect(countWords("one\ntwo\t three\r\nfour")).toBe(4);
  });
});
