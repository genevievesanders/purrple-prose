"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Draft = { title: string; content: string };
type ChatMessage = { role: "user" | "assistant"; content: string };
type Tab = "brainstorm" | "review";

/**
 * The agentic side panel. Routes to the orchestrator via /api/agents and
 * streams responses. Reads the live (possibly unsaved) draft through
 * getDraft so agents always see what's on screen.
 */
export function AgentPanel({
  getDraft,
  onClose,
}: {
  getDraft: () => Draft;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("brainstorm");

  return (
    <aside className="fixed bottom-0 right-0 top-[57px] z-50 flex w-80 flex-col border-l border-plum-100 bg-cream-100/95 shadow-xl backdrop-blur md:w-96">
      <div className="flex items-center justify-between border-b border-plum-100 px-4 py-2">
        <div className="flex gap-1">
          {(["brainstorm", "review"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1 text-sm capitalize transition ${
                tab === t
                  ? "bg-plum-700 text-white"
                  : "text-plum-600 hover:bg-plum-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-lg px-2 py-1 text-plum-400 transition hover:bg-plum-100 hover:text-plum-700"
        >
          ✕
        </button>
      </div>

      {tab === "brainstorm" ? (
        <BrainstormTab getDraft={getDraft} />
      ) : (
        <ReviewTab getDraft={getDraft} />
      )}
    </aside>
  );
}

async function streamAgent(
  body: object,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Agent request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="prose-panel text-sm leading-relaxed text-plum-900">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

function BrainstormTab({ getDraft }: { getDraft: () => Draft }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAgent(
        { kind: "brainstorm", draft: getDraft(), messages: history },
        controller.signal,
        (chunk) =>
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            next[next.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
            return next;
          })
      );
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.content === "") {
          next[next.length - 1] = {
            ...last,
            content: "*(the cat wandered off — try again)*",
          };
        }
        return next;
      });
    } finally {
      setBusy(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-plum-400">
            Think out loud about your story.
            <br />
            The Muse reads your draft before answering.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="ml-8 rounded-2xl rounded-br-sm bg-plum-700 px-3 py-2 text-sm text-white"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="mr-4 rounded-2xl rounded-bl-sm border border-plum-100 bg-white/70 px-3 py-2"
            >
              {m.content ? (
                <Markdown text={m.content} />
              ) : (
                <span className="cat-thinking text-sm text-plum-400">
                  purring up a thought…
                </span>
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="border-t border-plum-100 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What if…"
            aria-label="Brainstorm message"
            className="w-full rounded-xl border border-plum-200 bg-white/70 px-3 py-2 text-sm text-plum-900 outline-none focus:border-plum-400"
          />
          <button
            type="submit"
            disabled={busy || input.trim() === ""}
            className="shrink-0 rounded-xl bg-plum-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-plum-800 disabled:opacity-50"
          >
            ↑
          </button>
        </div>
      </form>
    </>
  );
}

function ReviewTab({ getDraft }: { getDraft: () => Draft }) {
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (busy) return;
    setReview("");
    setBusy(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamAgent(
        { kind: "review", draft: getDraft() },
        controller.signal,
        (chunk) => setReview((prev) => prev + chunk)
      );
    } catch {
      setReview((prev) => prev || "*(the cat wandered off — try again)*");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="w-full rounded-xl bg-plum-700 py-2 text-sm font-medium text-white transition hover:bg-plum-800 disabled:opacity-50"
      >
        {busy ? "reading…" : "Review my draft"}
      </button>
      <p className="mt-2 text-center text-xs text-plum-400">
        Line edits, tone, and pacing on what&apos;s currently on the page.
      </p>
      {review && (
        <div className="mt-4 rounded-2xl border border-plum-100 bg-white/70 p-3">
          <Markdown text={review} />
        </div>
      )}
    </div>
  );
}
