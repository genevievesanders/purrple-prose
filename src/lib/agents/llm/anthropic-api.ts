import Anthropic from "@anthropic-ai/sdk";
import type { CompletionRequest, LLMProvider } from "./types";

/**
 * Direct Anthropic API provider — the production path. No subprocess,
 * ~1s to first token, real streaming; works anywhere Node runs
 * (including serverless). Selected automatically when ANTHROPIC_API_KEY
 * is set.
 */

const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 4096;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY
  return client;
}

export class AnthropicAPIProvider implements LLMProvider {
  readonly name = "anthropic-api";

  async complete(req: CompletionRequest): Promise<string> {
    const res = await getClient().messages.create({
      model: req.model ?? process.env.AGENT_MODEL ?? DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: req.system,
      messages: req.messages,
    });
    return res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  }

  async *stream(req: CompletionRequest): AsyncIterable<string> {
    const stream = getClient().messages.stream({
      model: req.model ?? process.env.AGENT_MODEL ?? DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: req.system,
      messages: req.messages,
    });
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
