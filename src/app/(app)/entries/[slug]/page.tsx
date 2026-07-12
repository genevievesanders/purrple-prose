import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { getEntryBySlugOrId } from "@/lib/db/entries";
import { Editor } from "./editor";

export const metadata = { title: "Writing · Purrple Prose" };

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userId = await requireUserId();
  const entry = await getEntryBySlugOrId(userId, decodeURIComponent(slug));
  if (!entry) notFound();

  return (
    <Editor
      id={entry.id}
      initialTitle={entry.title}
      initialContent={entry.content}
      initialWordCount={entry.wordCount}
      initialTags={entry.tags}
      initialSlug={entry.slug}
    />
  );
}
