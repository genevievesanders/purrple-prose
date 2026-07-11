"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { markNoteReadAction } from "./actions";

/**
 * "The cat left something while you slept" — collapsed teaser that opens
 * into the coach's note; opening marks it read (it stays visible for the
 * session, gone on next visit).
 */
export function CoachNoteCard({ id, text }: { id: string; text: string }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-plum-200 bg-plum-50">
      {open ? (
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-plum-400">
            <span aria-hidden>🐾</span> left overnight
          </div>
          <div className="prose-panel text-sm leading-relaxed text-plum-900">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-plum-100/60"
          onClick={() => {
            setOpen(true);
            startTransition(() => markNoteReadAction(id));
          }}
        >
          <span className="text-2xl" aria-hidden>
            🐾
          </span>
          <span className="text-sm text-plum-700">
            The cat left something while you slept…
          </span>
          <span className="ml-auto text-xs text-plum-400">open</span>
        </button>
      )}
    </div>
  );
}
