import type { PromptSource } from "./types";
import { StubPromptSource } from "./stub";

export type { CatPrompt, PromptContext, PromptSource } from "./types";

/**
 * The active prompt source. Phase 4 swaps this for the Muse agent behind
 * the same interface.
 */
export function getPromptSource(): PromptSource {
  return new StubPromptSource();
}
