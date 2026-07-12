import { afterEach, describe, expect, it, vi } from "vitest";
import { getLLMProvider, setLLMProviderForTesting } from "./index";

function reset() {
  setLLMProviderForTesting(null);
  vi.unstubAllEnvs();
}

describe("provider selection", () => {
  afterEach(reset);

  it("prefers the direct API when a key is present", () => {
    vi.stubEnv("LLM_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    vi.stubEnv("CLAUDE_CODE_OAUTH_TOKEN", "sk-ant-oat01-test");
    setLLMProviderForTesting(null);
    expect(getLLMProvider().name).toBe("anthropic-api");
  });

  it("uses the Agent SDK when only a subscription token exists", () => {
    vi.stubEnv("LLM_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("CLAUDE_CODE_OAUTH_TOKEN", "sk-ant-oat01-test");
    setLLMProviderForTesting(null);
    expect(getLLMProvider().name).toBe("claude-agent-sdk");
  });

  it("falls back to mock with no auth", () => {
    vi.stubEnv("LLM_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("CLAUDE_CODE_OAUTH_TOKEN", "");
    setLLMProviderForTesting(null);
    expect(getLLMProvider().name).toBe("mock");
  });

  it("LLM_PROVIDER forces a choice over auto-detection", () => {
    vi.stubEnv("LLM_PROVIDER", "mock");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    setLLMProviderForTesting(null);
    expect(getLLMProvider().name).toBe("mock");
  });
});
