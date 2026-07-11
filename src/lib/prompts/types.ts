/**
 * What the cat delivers when it wakes up.
 */
export type CatPrompt = {
  kind: "prompt" | "words";
  /** The prompt sentence, or an intro line for a word set. */
  text: string;
  /** Present when kind === "words": a set of words to weave into the draft. */
  words?: string[];
};

/** Context available when generating a prompt. */
export type PromptContext = {
  userId: string;
  /** Title of the most recently touched entry, if any. */
  recentTitle?: string;
  /** Words written today. */
  wordsToday: number;
};

/**
 * Source of cat prompts. Phase 3 ships a stub; Phase 4 replaces it with the
 * Muse agent (same interface, conditioned on the user's writing via RAG).
 */
export interface PromptSource {
  getPrompt(ctx: PromptContext): Promise<CatPrompt>;
}
