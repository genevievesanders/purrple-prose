import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { listEntries } from "@/lib/db/entries";
import { getUnreadNote } from "@/lib/agents/coach";
import { createEntryAction } from "./actions";
import { CoachNoteCard } from "./coach-note-card";
import { DeleteEntryButton } from "./delete-entry-button";

export const metadata = { title: "Entries · Purrple Prose" };

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EntriesPage() {
  const userId = await requireUserId();
  const [items, note] = await Promise.all([
    listEntries(userId),
    getUnreadNote(userId),
  ]);

  return (
    <div>
      {note && <CoachNoteCard id={note.id} text={note.text} />}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-plum-900">Your stories</h1>
        <form action={createEntryAction}>
          <button
            type="submit"
            className="rounded-xl bg-plum-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-plum-800"
          >
            + New entry
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-plum-200 p-12 text-center">
          <div className="mb-3 text-4xl" aria-hidden>
            💤
          </div>
          <p className="text-plum-500">
            The page is blank and the cat is asleep.
            <br />
            Start your first story.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((entry) => (
            <li
              key={entry.id}
              className="group flex items-center justify-between rounded-xl border border-plum-100 bg-white/60 px-4 py-3 transition hover:border-plum-300"
            >
              <Link href={`/entries/${entry.id}`} className="min-w-0 flex-1">
                <div className="truncate font-serif text-lg text-plum-900">
                  {entry.title}
                </div>
                <div className="text-xs text-plum-400">
                  {entry.wordCount.toLocaleString()} words ·{" "}
                  {formatDate(entry.updatedAt)}
                </div>
              </Link>
              <DeleteEntryButton id={entry.id} title={entry.title} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
