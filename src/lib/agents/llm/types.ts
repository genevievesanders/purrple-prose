/**
 * Provider-agnostic LLM interface. The rest of the agent layer only ever
 * talks to this — swapping Anthropic API / Claude Agent SDK / mock is a
 * factory change, not a rewrite.
 */

export type LLMMessage = { role: "user" | "assistant"; content: string };

export type CompletionRequest = {
  /** System prompt (the agent's persona). */
  system: string;
  /** Conversation so far; last message is the live request. */
  messages: LLMMessage[];
  /** Provider-specific model id. */
  model?: string;
};

export interface LLMProvider {
  readonly name: string;
  /** One-shot completion; resolves with the full text. */
  complete(req: CompletionRequest): Promise<string>;
  /** Streaming completion; yields text deltas. */
  stream(req: CompletionRequest): AsyncIterable<string>;
}
