import type { LLMProvider } from "./types";
import { ClaudeAgentSDKProvider } from "./claude-agent-sdk";
import { MockProvider } from "./mock";

export type { CompletionRequest, LLMMessage, LLMProvider } from "./types";

let cached: LLMProvider | null = null;
let warned = false;

/**
 * Provider selection:
 * - LLM_PROVIDER env forces "sdk" | "mock"
 * - otherwise "sdk" when Claude auth is configured, "mock" as fallback
 *
 * Adding a direct Anthropic-API provider later = one new class + one branch.
 */
export function getLLMProvider(): LLMProvider {
  if (cached) return cached;

  const forced = process.env.LLM_PROVIDER;
  const hasAuth =
    !!process.env.CLAUDE_CODE_OAUTH_TOKEN || !!process.env.ANTHROPIC_API_KEY;

  if (forced === "mock") {
    cached = new MockProvider();
  } else if (forced === "sdk" || hasAuth) {
    cached = new ClaudeAgentSDKProvider();
  } else {
    if (!warned) {
      warned = true;
      console.warn(
        "[agents] No Claude auth configured (CLAUDE_CODE_OAUTH_TOKEN or " +
          "ANTHROPIC_API_KEY) — using the mock LLM provider."
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
