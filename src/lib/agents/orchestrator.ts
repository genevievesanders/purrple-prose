import { AGENTS, type AgentKey } from "./registry";
import { getLLMProvider, type LLMMessage } from "./llm";
import {
  describeContext,
  excerptDraft,
  getWritingContext,
} from "./context";
import { searchLore, type LoreHit } from "./memory/store";

/**
 * The orchestrator is the single entry point to the agent crew. The web
 * layer submits an AgentTask; routing decides which sub-agent runs and what
 * context it sees — including retrieval from the lore bible. Nothing here
 * imports from the web layer.
 */

export type Draft = { title: string; content: string };

export type AgentTask =
  | { kind: "cat-prompt" }
  | { kind: "review"; draft: Draft }
  | { kind: "critique"; draft: Draft }
  | { kind: "continuity"; draft: Draft; entryId: string }
  | { kind: "brainstorm"; draft: Draft; messages: LLMMessage[] };

export function routeTask(task: AgentTask): AgentKey {
  switch (task.kind) {
    case "cat-prompt":
      return "muse-cat";
    case "review":
      return "editor";
    case "critique":
      return "critic";
    case "continuity":
      return "continuity";
    case "brainstorm":
      return "muse";
  }
}

function formatLore(hits: LoreHit[]): string {
  if (hits.length === 0) return "(the lore bible is empty so far)";
  return hits
    .map(
      (h) =>
        `— From "${h.entryTitle}" (part ${h.seq + 1}):\n${h.text}`
    )
    .join("\n\n");
}

async function buildMessages(
  userId: string,
  task: AgentTask
): Promise<LLMMessage[]> {
  const writingCtx = await getWritingContext(userId);
  const ctx = describeContext(writingCtx);

  switch (task.kind) {
    case "cat-prompt": {
      // Ground the gift in the writer's world: retrieve a few beats of lore.
      const lore = await searchLore(userId, writingCtx.recentTitles.join(" "), {
        k: 3,
      });
      return [
        {
          role: "user",
          content: `Writer context: ${ctx}\n\nGlimpses from their world:\n${formatLore(lore)}\n\nThe cat has been woken. Deliver the gift.`,
        },
      ];
    }
    case "review":
      return [
        {
          role: "user",
          content: `Writer context: ${ctx}\n\nReview this draft.\n\nTitle: ${task.draft.title}\n\n---\n${excerptDraft(task.draft.content)}\n---`,
        },
      ];
    case "critique":
      return [
        {
          role: "user",
          content: `Writer context: ${ctx}\n\nThe writer has asked for structural feedback on this draft.\n\nTitle: ${task.draft.title}\n\n---\n${excerptDraft(task.draft.content)}\n---`,
        },
      ];
    case "continuity": {
      const query = `${task.draft.title}\n${task.draft.content}`;
      const lore = await searchLore(userId, query, {
        k: 6,
        excludeEntryId: task.entryId,
      });
      return [
        {
          role: "user",
          content: `Writer context: ${ctx}\n\nCurrent draft:\n\nTitle: ${task.draft.title}\n\n---\n${excerptDraft(task.draft.content)}\n---\n\nLore bible excerpts from the writer's OTHER stories:\n\n${formatLore(lore)}\n\nCheck the draft against the lore.`,
        },
      ];
    }
    case "brainstorm": {
      const lore = await searchLore(
        userId,
        task.messages[task.messages.length - 1]?.content ?? task.draft.title,
        { k: 3 }
      );
      const intro: LLMMessage = {
        role: "user",
        content: `Writer context: ${ctx}\n\nCurrent draft, for reference:\n\nTitle: ${task.draft.title}\n\n---\n${excerptDraft(task.draft.content)}\n---\n\nPossibly-relevant lore from their other stories:\n${formatLore(lore)}\n\n(The conversation follows; respond to the latest message.)`,
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
