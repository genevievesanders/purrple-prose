import os from "node:os";
import type { CompletionRequest, LLMMessage, LLMProvider } from "./types";

/**
 * LLM provider backed by @anthropic-ai/claude-agent-sdk.
 *
 * Authenticates via CLAUDE_CODE_OAUTH_TOKEN (a subscription token from
 * `claude setup-token`) or ANTHROPIC_API_KEY if present. The SDK spawns a
 * local Claude Code process per call — fine for a local demo; deployments
 * should use the Anthropic API provider instead.
 *
 * The SDK is used as a pure text-completion engine: no tools, one turn,
 * no project settings (settingSources: []).
 */

const DEFAULT_MODEL = "claude-sonnet-5";

function flatten(messages: LLMMessage[]): string {
  // The SDK takes a single prompt string per query; chat history is
  // flattened into a transcript. Adequate for short panel conversations.
  if (messages.length === 1) return messages[0].content;
  return messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");
}

async function loadQuery() {
  // Dynamic import keeps the SDK out of client bundles and lets the mock
  // provider work in environments where the SDK can't run.
  const mod = await import("@anthropic-ai/claude-agent-sdk");
  return mod.query;
}

function baseOptions(model?: string) {
  return {
    model: model ?? process.env.AGENT_MODEL ?? DEFAULT_MODEL,
    maxTurns: 1,
    allowedTools: [] as string[],
    settingSources: [] as never[],
    cwd: os.tmpdir(), // never this project — don't inherit CLAUDE.md etc.
  };
}

export class ClaudeAgentSDKProvider implements LLMProvider {
  readonly name = "claude-agent-sdk";

  async complete(req: CompletionRequest): Promise<string> {
    const query = await loadQuery();
    for await (const message of query({
      prompt: flatten(req.messages),
      options: { ...baseOptions(req.model), systemPrompt: req.system },
    })) {
      if (message.type === "result") {
        if (message.subtype === "success") return message.result;
        throw new Error(`Agent SDK error: ${message.subtype}`);
      }
    }
    throw new Error("Agent SDK returned no result");
  }

  async *stream(req: CompletionRequest): AsyncIterable<string> {
    const query = await loadQuery();
    for await (const message of query({
      prompt: flatten(req.messages),
      options: {
        ...baseOptions(req.model),
        systemPrompt: req.system,
        includePartialMessages: true,
      },
    })) {
      if (message.type === "stream_event") {
        const event = message.event;
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          yield event.delta.text;
        }
      } else if (message.type === "result" && message.subtype !== "success") {
        throw new Error(`Agent SDK error: ${message.subtype}`);
      }
    }
  }
}
