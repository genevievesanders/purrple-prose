import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug";
import { parseTags, tagsToInput } from "./tags";

describe("slugify", () => {
  it("kebab-cases titles", () => {
    expect(slugify("The Familiar's First Nap")).toBe("the-familiar-s-first-nap");
    expect(slugify("  Hello,   World!  ")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Café Éclair")).toBe("cafe-eclair");
  });

  it("returns empty for untitled/empty/symbol-only titles", () => {
    expect(slugify("Untitled")).toBe("");
    expect(slugify("")).toBe("");
    expect(slugify("???!!!")).toBe("");
  });

  it("caps length without trailing hyphens", () => {
    const s = slugify("word ".repeat(40));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("returns base when free", () => {
    expect(uniqueSlug("fox", new Set())).toBe("fox");
  });

  it("suffixes on collision", () => {
    expect(uniqueSlug("fox", new Set(["fox"]))).toBe("fox-2");
    expect(uniqueSlug("fox", new Set(["fox", "fox-2"]))).toBe("fox-3");
  });
});

describe("parseTags", () => {
  it("normalizes freeform input", () => {
    expect(parseTags("#Fiction, wip  #Short_Story")).toEqual([
      "fiction",
      "wip",
      "short-story",
    ]);
  });

  it("dedupes and drops empties", () => {
    expect(parseTags("#wip #wip ## , ,")).toEqual(["wip"]);
    expect(parseTags("")).toEqual([]);
  });

  it("round-trips through the input form", () => {
    const tags = ["fiction", "wip"];
    expect(parseTags(tagsToInput(tags))).toEqual(tags);
  });
});
