"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import {
  deleteMilwordyGoal,
  upsertMilwordyGoal,
} from "@/lib/db/progress";

const joinSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  targetWords: z.coerce
    .number()
    .int()
    .min(1_000, "Even the cat expects at least a thousand")
    .max(10_000_000),
});

export async function joinMilwordyAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = joinSchema.safeParse({
    year: formData.get("year"),
    targetWords: formData.get("targetWords"),
  });
  if (!parsed.success) return;

  await upsertMilwordyGoal(userId, parsed.data.year, parsed.data.targetWords);
  revalidatePath("/progress");
}

export async function leaveMilwordyAction(formData: FormData) {
  const userId = await requireUserId();
  const year = z.coerce.number().int().safeParse(formData.get("year"));
  if (!year.success) return;

  await deleteMilwordyGoal(userId, year.data);
  revalidatePath("/progress");
}
