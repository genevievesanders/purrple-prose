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

const CONTINUITY_TEXT = `*(mock continuity check — connect Claude for the real keeper)*

**Contradictions**

- None found — though the mock cat only pretends to remember.

**Threads worth keeping**

- The lore bible plumbing is working; retrieved excerpts were attached to this request.`;

const CRITIC_TEXT = `*(mock critique — connect Claude for the real Critic)*

**What this story is doing** — holding a mirror at a slight angle.

**The one thing** — give your protagonist a want that costs something.`;

const COACH_TEXT = `*(mock note — connect Claude for the real coach)*

You're a few words behind, but the page doesn't hold grudges. Try this: one sentence about what the lighthouse looks like from the water. Just one.

— 🐾`;

function responseFor(req: CompletionRequest): string {
  if (req.system.includes("[agent:coach]")) return COACH_TEXT;
  if (req.system.includes("[agent:muse-cat]")) return CAT_PROMPT_JSON;
  if (req.system.includes("[agent:editor]")) return REVIEW_TEXT;
  if (req.system.includes("[agent:continuity]")) return CONTINUITY_TEXT;
  if (req.system.includes("[agent:critic]")) return CRITIC_TEXT;
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
