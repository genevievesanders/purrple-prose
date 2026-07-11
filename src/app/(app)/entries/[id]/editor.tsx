"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countWords } from "@/lib/words/count";
import { saveEntryAction } from "../actions";

const AUTOSAVE_DELAY_MS = 1200;

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

function localDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  saved: "saved",
  unsaved: "…",
  saving: "saving…",
  error: "couldn't save — retrying",
};

export function Editor({
  id,
  initialTitle,
  initialContent,
  initialWordCount,
}: {
  id: string;
  initialTitle: string;
  initialContent: string;
  initialWordCount: number;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>("saved");

  const wordCount = useMemo(
    () => (content === initialContent ? initialWordCount : countWords(content)),
    [content, initialContent, initialWordCount]
  );

  // Refs so the debounced save always sees the latest values without
  // re-creating timers on every keystroke. Synced after render (the
  // autosave debounce is far longer than a render pass).
  const latest = useRef({ title, content });
  useEffect(() => {
    latest.current = { title, content };
  }, [title, content]);
  const lastSaved = useRef({ title: initialTitle, content: initialContent });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  function schedule() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  }

  async function save() {
    if (saving.current) return; // in-flight save re-checks when done
    const snapshot = { ...latest.current };
    if (
      snapshot.title === lastSaved.current.title &&
      snapshot.content === lastSaved.current.content
    ) {
      setStatus("saved");
      return;
    }

    saving.current = true;
    setStatus("saving");
    try {
      const result = await saveEntryAction({
        id,
        title: snapshot.title,
        content: snapshot.content,
        clientDate: localDateString(),
      });
      if (result.ok) {
        lastSaved.current = snapshot;
        // If the user kept typing during the save, go around again.
        if (
          latest.current.title !== snapshot.title ||
          latest.current.content !== snapshot.content
        ) {
          setStatus("unsaved");
          schedule();
        } else {
          setStatus("saved");
        }
      } else {
        setStatus("error");
        schedule();
      }
    } catch {
      setStatus("error");
      schedule();
    } finally {
      saving.current = false;
    }
  }

  function onEdit() {
    setStatus("unsaved");
    schedule();
  }

  // Warn before closing with unsaved changes; clear timer on unmount.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (
        latest.current.title !== lastSaved.current.title ||
        latest.current.content !== lastSaved.current.content
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            onEdit();
          }}
          placeholder="Untitled"
          aria-label="Entry title"
          className="w-full bg-transparent font-serif text-3xl text-plum-900 outline-none placeholder:text-plum-200"
        />
        <div className="shrink-0 text-right text-xs text-plum-400">
          <div>{wordCount.toLocaleString()} words</div>
          <div aria-live="polite">{STATUS_LABEL[status]}</div>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onEdit();
        }}
        placeholder="It was a dark and stormy night…"
        aria-label="Entry content"
        spellCheck
        className="min-h-[65vh] w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-plum-900 outline-none placeholder:text-plum-200"
      />
    </div>
  );
}
