"use client";

import { useState, useTransition } from "react";
import { deleteEntryAction } from "./actions";

export function DeleteEntryButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${title}`}
        className="ml-3 rounded-lg px-2 py-1 text-sm text-plum-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
      >
        ✕
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-plum-100 bg-cream-50 p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-3xl" aria-hidden>
              🐾
            </div>
            <h2
              id="delete-dialog-title"
              className="font-serif text-xl text-plum-900"
            >
              Let this story go?
            </h2>
            <p className="mt-2 text-sm text-plum-500">
              &ldquo;{title}&rdquo; will be gone for good — the cat will forget
              it ever happened.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-plum-200 px-4 py-2 text-sm text-plum-700 transition hover:bg-plum-100"
              >
                Keep it
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteEntryAction(id);
                    setOpen(false);
                  })
                }
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {pending ? "Letting go…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
