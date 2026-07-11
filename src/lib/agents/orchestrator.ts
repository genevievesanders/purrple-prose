import { AGENTS, type AgentKey } from "./registry";
import { getLLMProvider, type LLMMessage } from "./llm";
import {
  describeContext,
  excerptDraft,
  getWritingContext,
} from "./context";

/**
 * The orchestrator is the single entry point to the agent crew. The web
 * layer submits an AgentTask; routing decides which sub-agent runs and what
 * context it sees. Nothing here imports from the web layer.
 */

export type Draft = { title: string; content: string };

export type AgentTask =
  | { kind: "cat-prompt" }
  | { kind: "review"; draft: Draft }
  | { kind: "brainstorm"; draft: Draft; messages: LLMMessage[] };

export function routeTask(task: AgentTask): AgentKey {
  switch (task.kind) {
    case "cat-prompt":
      return "muse-cat";
    case "review":
      return "editor";
    case "brainstorm":
      return "muse";
  }
}

async function buildMessages(
  userId: string,
  task: AgentTask
): Promise<LLMMessage[]> {
  const ctx = describeContext(await getWritingContext(userId));

  switch (task.kind) {
    case "cat-prompt":
      return [
        {
          role: "user",
          content: `Writer context: ${ctx}\n\nThe cat has been woken. Deliver the gift.`,
        },
      ];
    case "review":
      return [
        {
          role: "user",
          content: `Writer context: ${ctx}\n\nReview this draft.\n\nTitle: ${task.draft.title}\n\n---\n${excerptDraft(task.draft.content)}\n---`,
        },
      ];
    case "brainstorm": {
      const intro: LLMMessage = {
        role: "user",
        content: `Writer context: ${ctx}\n\nCurrent draft, for reference:\n\nTitle: ${task.draft.title}\n\n---\n${excerptDraft(task.draft.content)}\n---\n\n(The conversation follows; respond to the latest message.)`,
      };
      // Keep the panel conversation bounded.
      const recent = task.messages.slice(-12);
      return [intro, ...recent];
    }
  }
}

export async function runTask(
  userId: string,
  task: AgentTask
): Promise<string> {
  const agent = AGENTS[routeTask(task)];
  const messages = await buildMessages(userId, task);
  return getLLMProvider().complete({
    system: agent.persona,
    messages,
    model: agent.model,
  });
}

export async function* streamTask(
  userId: string,
  task: AgentTask
): AsyncIterable<string> {
  const agent = AGENTS[routeTask(task)];
  const messages = await buildMessages(userId, task);
  yield* getLLMProvider().stream({
    system: agent.persona,
    messages,
    model: agent.model,
  });
}
