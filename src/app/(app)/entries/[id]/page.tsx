import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getEntry } from "@/lib/db/entries";
import { Editor } from "./editor";

export const metadata = { title: "Writing · Purrple Prose" };

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const entry = await getEntry(userId, id);
  if (!entry) notFound();

  return (
    <Editor
      id={entry.id}
      initialTitle={entry.title}
      initialContent={entry.content}
      initialWordCount={entry.wordCount}
    />
  );
}
