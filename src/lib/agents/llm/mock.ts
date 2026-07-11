import type { CompletionRequest, LLMProvider } from "./types";

/**
 * Deterministic mock provider — used in tests and as the fallback when no
 * Claude auth is configured, so the whole app stays demoable. Responses are
 * keyed off the system prompt's agent tag.
 */

const CAT_PROMPT_JSON = JSON.stringify({
  kind: "words",
  text: "The cat is running on imagination alone (no Claude auth yet) — still, work these in:",
  words: ["moonlit", "compass", "stray", "vow"],
});

const REVIEW_TEXT = `*(mock review — connect Claude to get real feedback)*

**Overall:** Your draft has a clear voice. Two things to tighten:

1. **Pacing** — the opening lingers; consider cutting the second sentence.
2. **Tone** — the ending shifts formal. Try reading it aloud and smoothing the last paragraph.

The cat bats approvingly at your word choices.`;

const BRAINSTORM_TEXT = `*(mock brainstorm — connect Claude for the real Muse)*

What if the thing your character wants most is something they already had and gave away? A few threads to pull:

- Who witnessed them giving it away?
- What would it cost to ask for it back?
- What small object could stand in for it on the page?`;

function responseFor(req: CompletionRequest): string {
  if (req.system.includes("[agent:muse-cat]")) return CAT_PROMPT_JSON;
  if (req.system.includes("[agent:editor]")) return REVIEW_TEXT;
  return BRAINSTORM_TEXT;
}

export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async complete(req: CompletionRequest): Promise<string> {
    return responseFor(req);
  }

  async *stream(req: CompletionRequest): AsyncIterable<string> {
    // Stream word-by-word so the UI's streaming path is exercised.
    const words = responseFor(req).split(/(?<=\s)/);
    for (const w of words) {
      yield w;
      await new Promise((r) => setTimeout(r, 15));
    }
  }
}
