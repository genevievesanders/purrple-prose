import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import {
  listEntries,
  type EntrySort,
  type SortDir,
} from "@/lib/db/entries";
import { getUnreadNote } from "@/lib/agents/coach";
import { createEntryAction } from "./actions";
import { CoachNoteCard } from "./coach-note-card";
import { DeleteEntryButton } from "./delete-entry-button";
import { SortControls } from "./sort-controls";

export const metadata = { title: "Entries · Purrple Prose" };

const SORTS = new Set(["title", "created", "updated", "words"]);

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; sort?: string; dir?: string }>;
}) {
  const sp = await searchParams;
  const tag = sp.tag?.toLowerCase();
  const sort: EntrySort = SORTS.has(sp.sort ?? "")
    ? (sp.sort as EntrySort)
    : "updated";
  const dir: SortDir =
    sp.dir === "asc" || sp.dir === "desc"
      ? sp.dir
      : sort === "title"
        ? "asc"
        : "desc";

  const userId = await requireUserId();
  const [items, note] = await Promise.all([
    listEntries(userId, { tag, sort, dir }),
    getUnreadNote(userId),
  ]);

  return (
    <div>
      {note && <CoachNoteCard id={note.id} text={note.text} />}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-plum-900">Your stories</h1>
        <div className="flex items-center gap-3">
          <SortControls sort={sort} dir={dir} />
          <form action={createEntryAction}>
            <button
              type="submit"
              className="rounded-xl bg-plum-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-800"
            >
              + New entry
            </button>
          </form>
        </div>
      </div>

      {tag && (
        <div className="mb-4 flex items-center gap-2 text-sm text-plum-500">
          showing{" "}
          <span className="rounded-full bg-plum-100 px-2.5 py-0.5 font-medium text-plum-800">
            #{tag}
          </span>
          <Link href="/entries" className="text-plum-400 underline hover:text-plum-600">
            clear
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-plum-200 p-12 text-center">
          <div className="mb-3 text-4xl" aria-hidden>
            💤
          </div>
          <p className="text-plum-500">
            {tag ? (
              <>Nothing tagged #{tag} yet.</>
            ) : (
              <>
                The page is blank and the cat is asleep.
                <br />
                Start your first story.
              </>
            )}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((entry) => (
            <li
              key={entry.id}
              className="group rounded-xl border border-plum-100 bg-white/60 px-4 py-3 transition hover:border-plum-300"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/entries/${entry.slug ?? entry.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate font-serif text-lg text-plum-900">
                    {entry.title}
                  </div>
                  <div className="text-xs text-plum-400">
                    {entry.wordCount.toLocaleString()} words ·{" "}
                    {formatDate(entry.updatedAt)}
                  </div>
                </Link>
                <DeleteEntryButton id={entry.id} title={entry.title} />
              </div>
              {entry.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {entry.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/entries?tag=${encodeURIComponent(t)}`}
                      className={`rounded-full px-2 py-0.5 text-xs transition ${
                        t === tag
                          ? "bg-plum-700 text-white"
                          : "bg-plum-100 text-plum-700 hover:bg-plum-200"
                      }`}
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
