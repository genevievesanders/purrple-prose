import type { LLMProvider } from "./types";
import { AnthropicAPIProvider } from "./anthropic-api";
import { ClaudeAgentSDKProvider } from "./claude-agent-sdk";
import { MockProvider } from "./mock";

export type { CompletionRequest, LLMMessage, LLMProvider } from "./types";

let cached: LLMProvider | null = null;
let warned = false;

/**
 * Provider selection, most-production-ready first:
 * 1. LLM_PROVIDER env forces "api" | "sdk" | "mock"
 * 2. ANTHROPIC_API_KEY   → direct API (fast, serverless-safe)
 * 3. CLAUDE_CODE_OAUTH_TOKEN → Claude Agent SDK (local dev via
 *    subscription; spawns a subprocess — do not rely on it serverless)
 * 4. neither → deterministic mock (app stays demoable)
 */
export function getLLMProvider(): LLMProvider {
  if (cached) return cached;

  switch (process.env.LLM_PROVIDER) {
    case "api":
      cached = new AnthropicAPIProvider();
      return cached;
    case "sdk":
      cached = new ClaudeAgentSDKProvider();
      return cached;
    case "mock":
      cached = new MockProvider();
      return cached;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    cached = new AnthropicAPIProvider();
  } else if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    cached = new ClaudeAgentSDKProvider();
  } else {
    if (!warned) {
      warned = true;
      console.warn(
        "[agents] No Claude auth configured (ANTHROPIC_API_KEY or " +
          "CLAUDE_CODE_OAUTH_TOKEN) — using the mock LLM provider."
      );
    }
    cached = new MockProvider();
  }
  return cached;
}

/** Test seam. */
export function setLLMProviderForTesting(p: LLMProvider | null) {
  cached = p;
}
