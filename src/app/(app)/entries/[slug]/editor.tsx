"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countWords } from "@/lib/words/count";
import { tagsToInput } from "@/lib/entries/tags";
import { AgentPanel } from "@/components/agent-panel";
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
  initialTags,
  initialSlug,
}: {
  id: string;
  initialTitle: string;
  initialContent: string;
  initialWordCount: number;
  initialTags: string[];
  initialSlug: string | null;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tagsInput, setTagsInput] = useState(() => tagsToInput(initialTags));
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [panelOpen, setPanelOpen] = useState(false);
  const currentSlug = useRef(initialSlug);

  const wordCount = useMemo(
    () => (content === initialContent ? initialWordCount : countWords(content)),
    [content, initialContent, initialWordCount]
  );

  // Refs so the debounced save always sees the latest values without
  // re-creating timers on every keystroke. Synced after render (the
  // autosave debounce is far longer than a render pass).
  const latest = useRef({ title, content, tagsInput });
  useEffect(() => {
    latest.current = { title, content, tagsInput };
  }, [title, content, tagsInput]);
  const lastSaved = useRef({
    title: initialTitle,
    content: initialContent,
    tagsInput: tagsToInput(initialTags),
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);

  function isDirty(): boolean {
    return (
      latest.current.title !== lastSaved.current.title ||
      latest.current.content !== lastSaved.current.content ||
      latest.current.tagsInput !== lastSaved.current.tagsInput
    );
  }

  function schedule() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  }

  async function save() {
    if (saving.current) return; // in-flight save re-checks when done
    const snapshot = { ...latest.current };
    if (!isDirty()) {
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
        tagsInput: snapshot.tagsInput,
        clientDate: localDateString(),
      });
      if (result.ok) {
        lastSaved.current = snapshot;
        // Keep the address bar on the entry's slug as the title changes.
        const target = result.slug ?? id;
        if (target !== currentSlug.current) {
          currentSlug.current = target;
          window.history.replaceState(null, "", `/entries/${target}`);
        }
        // If the user kept typing during the save, go around again.
        if (isDirty()) {
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
      if (isDirty()) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-1 flex items-baseline justify-between gap-4">
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
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right text-xs text-plum-400">
            <div>{wordCount.toLocaleString()} words</div>
            <div aria-live="polite">{STATUS_LABEL[status]}</div>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-pressed={panelOpen}
            className={`rounded-xl border px-3 py-1.5 text-sm transition ${
              panelOpen
                ? "border-plum-400 bg-plum-100 text-plum-800"
                : "border-plum-200 text-plum-600 hover:bg-plum-100"
            }`}
          >
            🐾 muse
          </button>
        </div>
      </div>

      <input
        value={tagsInput}
        onChange={(e) => {
          setTagsInput(e.target.value);
          onEdit();
        }}
        placeholder="#tags — like #fiction #wip"
        aria-label="Entry tags"
        spellCheck={false}
        className="mb-4 w-full bg-transparent text-sm text-plum-500 outline-none placeholder:text-plum-200"
      />

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

      {panelOpen && (
        <AgentPanel
          entryId={id}
          getDraft={() => latest.current}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}
