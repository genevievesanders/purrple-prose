import { describe, expect, it } from "vitest";
import { parseCatPrompt } from "./muse";

describe("parseCatPrompt", () => {
  it("parses a clean prompt object", () => {
    expect(
      parseCatPrompt('{"kind":"prompt","text":"Write the goodbye."}')
    ).toEqual({ kind: "prompt", text: "Write the goodbye." });
  });

  it("parses a words object", () => {
    const p = parseCatPrompt(
      '{"kind":"words","text":"A gift:","words":["ember","hush"]}'
    );
    expect(p).toEqual({
      kind: "words",
      text: "A gift:",
      words: ["ember", "hush"],
    });
  });

  it("tolerates code fences and surrounding prose", () => {
    const p = parseCatPrompt(
      'Here you go!\n```json\n{"kind":"prompt","text":"A door appears."}\n```'
    );
    expect(p?.text).toBe("A door appears.");
  });

  it("rejects malformed payloads", () => {
    expect(parseCatPrompt("The cat says hi")).toBeNull();
    expect(parseCatPrompt('{"kind":"prompt"}')).toBeNull();
    expect(parseCatPrompt('{"kind":"words","text":"hi","words":[]}')).toBeNull();
    expect(
      parseCatPrompt('{"kind":"words","text":"hi","words":[1,2]}')
    ).toBeNull();
  });

  it("caps runaway word lists", () => {
    const words = Array.from({ length: 20 }, (_, i) => `w${i}`);
    const p = parseCatPrompt(
      JSON.stringify({ kind: "words", text: "hi", words })
    );
    expect(p?.words).toHaveLength(6);
  });
});
