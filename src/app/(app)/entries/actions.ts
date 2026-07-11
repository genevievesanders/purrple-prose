"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import * as entries from "@/lib/db/entries";
import { resolveWritingDate } from "@/lib/words/daily";

export async function createEntryAction() {
  const userId = await requireUserId();
  const entry = await entries.createEntry(userId);
  redirect(`/entries/${entry.id}`);
}

export async function deleteEntryAction(id: string) {
  const userId = await requireUserId();
  await entries.deleteEntry(userId, id);
  revalidatePath("/entries");
}

const saveSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(300),
  content: z.string().max(2_000_000),
  clientDate: z.string().optional(),
});

export async function saveEntryAction(input: {
  id: string;
  title: string;
  content: string;
  clientDate?: string;
}): Promise<{ ok: boolean; wordCount?: number }> {
  const userId = await requireUserId();
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const { id, title, content, clientDate } = parsed.data;
  const writingDate = resolveWritingDate(clientDate, new Date());

  const result = await entries.saveEntry(
    userId,
    id,
    { title: title.trim() || "Untitled", content },
    writingDate
  );
  if (!result) return { ok: false };

  return { ok: true, wordCount: result.wordCount };
}
