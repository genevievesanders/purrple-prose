import type { CatPrompt, PromptContext, PromptSource } from "./types";

/**
 * Stub prompt source — canned but lightly contextual. Replaced by the Muse
 * agent in Phase 4. Kept deterministic-ish (seeded by day + count) so the
 * cat doesn't repeat itself back-to-back.
 */

const PROMPTS = [
  "Write the moment your character realizes they've been wrong about someone for years.",
  "Someone in your story finds a door that wasn't there yesterday. Who opens it?",
  "Describe a place your character loves, at the exact hour it stops feeling safe.",
  "Your character receives a letter meant for someone else — and answers it.",
  "Write a scene where the weather knows something the characters don't.",
  "Two characters share a meal. One of them is lying. Don't say which.",
  "Something small goes missing. Its absence changes everything.",
  "Write the goodbye your character never got to say.",
];

const WORD_SETS: string[][] = [
  ["lantern", "hush", "borrowed", "salt"],
  ["threshold", "velvet", "echo", "unravel"],
  ["ember", "atlas", "whisper", "rust"],
  ["moth", "harbor", "secondhand", "gleam"],
  ["clockwork", "fern", "murmur", "hollow"],
];

const INTROS_FRESH = [
  "The cat stretches, and offers:",
  "A gift, from one writer to another:",
  "The cat was dreaming of this:",
];

const INTROS_WARMED_UP = [
  "You're warmed up. Try this:",
  "The cat approves of your progress. Now:",
  "More. The cat demands more:",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export class StubPromptSource implements PromptSource {
  async getPrompt(ctx: PromptContext): Promise<CatPrompt> {
    // Vary by day and how much has been written, so consecutive wakes differ.
    const day = Math.floor(Date.now() / 86_400_000);
    const seed = day * 31 + ctx.wordsToday + ctx.userId.length;

    const intro =
      ctx.wordsToday > 300
        ? pick(INTROS_WARMED_UP, seed)
        : pick(INTROS_FRESH, seed);

    // Alternate between a full prompt and a word set.
    if (seed % 2 === 0) {
      return { kind: "prompt", text: pick(PROMPTS, seed) };
    }
    return {
      kind: "words",
      text: `${intro} work these into your next paragraph.`,
      words: pick(WORD_SETS, seed),
    };
  }
}
