import type { CatPrompt, PromptContext, PromptSource } from "./types";
import { runTask } from "@/lib/agents/orchestrator";
import { StubPromptSource } from "./stub";

/**
 * PromptSource backed by the Muse agent. Parses the model's JSON reply;
 * any failure (auth, network, malformed output) falls back to the stub so
 * the cat always has something to say.
 */
export class MusePromptSource implements PromptSource {
  private fallback = new StubPromptSource();

  async getPrompt(ctx: PromptContext): Promise<CatPrompt> {
    try {
      const raw = await runTask(ctx.userId, { kind: "cat-prompt" });
      const parsed = parseCatPrompt(raw);
      if (parsed) return parsed;
      console.warn("[muse] unparseable cat prompt:", raw.slice(0, 200));
    } catch (err) {
      console.warn("[muse] falling back to stub:", err);
    }
    return this.fallback.getPrompt(ctx);
  }
}

export function parseCatPrompt(raw: string): CatPrompt | null {
  // Tolerate stray prose/code fences around the JSON object.
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]);
    if (typeof obj.text !== "string" || obj.text.length === 0) return null;
    if (obj.kind === "prompt") return { kind: "prompt", text: obj.text };
    if (
      obj.kind === "words" &&
      Array.isArray(obj.words) &&
      obj.words.length > 0 &&
      obj.words.every((w: unknown) => typeof w === "string")
    ) {
      return { kind: "words", text: obj.text, words: obj.words.slice(0, 6) };
    }
    return null;
  } catch {
    return null;
  }
}
