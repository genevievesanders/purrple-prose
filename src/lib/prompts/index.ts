import type { PromptSource } from "./types";
import { MusePromptSource } from "./muse";

export type { CatPrompt, PromptContext, PromptSource } from "./types";

/**
 * The active prompt source: the Muse agent, which itself falls back to the
 * canned stub if the LLM is unreachable or returns nonsense.
 */
export function getPromptSource(): PromptSource {
  return new MusePromptSource();
}
