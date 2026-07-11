import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { streamTask, type AgentTask } from "@/lib/agents/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  kind: z.enum(["review", "brainstorm", "critique", "continuity"]),
  draft: z.object({
    title: z.string().max(300),
    content: z.string().max(2_000_000),
  }),
  entryId: z.string().max(50).optional(), // continuity: exclude this entry
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20_000),
      })
    )
    .max(50)
    .optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad request", { status: 400 });

  const { kind, draft, entryId, messages } = parsed.data;
  let task: AgentTask;
  if (kind === "brainstorm") {
    task = { kind, draft, messages: messages ?? [] };
  } else if (kind === "continuity") {
    if (!entryId) return new Response("Bad request", { status: 400 });
    task = { kind, draft, entryId };
  } else {
    task = { kind, draft };
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamTask(userId, task)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("[agents] stream failed:", err);
        controller.enqueue(
          encoder.encode(
            "\n\n*(the cat lost its train of thought — try again)*"
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
