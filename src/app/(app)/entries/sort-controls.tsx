"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FIELDS = [
  { value: "updated", label: "last updated" },
  { value: "created", label: "date created" },
  { value: "title", label: "title" },
  { value: "words", label: "word count" },
] as const;

export function SortControls({
  sort,
  dir,
}: {
  sort: string;
  dir: "asc" | "desc";
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(next: { sort?: string; dir?: string }) {
    const q = new URLSearchParams(params.toString());
    if (next.sort) q.set("sort", next.sort);
    if (next.dir) q.set("dir", next.dir);
    router.replace(`/entries?${q.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <label className="sr-only" htmlFor="entry-sort">
        Sort entries by
      </label>
      <select
        id="entry-sort"
        value={sort}
        onChange={(e) => update({ sort: e.target.value })}
        className="rounded-lg border border-plum-200 bg-white/70 px-2 py-1 text-sm text-plum-700 outline-none focus:border-plum-400"
      >
        {FIELDS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => update({ dir: dir === "asc" ? "desc" : "asc" })}
        aria-label={`Sort ${dir === "asc" ? "descending" : "ascending"}`}
        title={dir === "asc" ? "ascending — click for descending" : "descending — click for ascending"}
        className="rounded-lg border border-plum-200 px-2 py-1 text-plum-700 transition hover:bg-plum-100"
      >
        {dir === "asc" ? "↑" : "↓"}
      </button>
    </div>
  );
}
