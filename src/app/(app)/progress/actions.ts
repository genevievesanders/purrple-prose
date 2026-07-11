"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import {
  deleteMilwordyGoal,
  upsertMilwordyGoal,
} from "@/lib/db/progress";

const goalSchema = z.object({
  targetWords: z.coerce
    .number()
    .int()
    .min(1_000, "Even the cat expects at least a thousand")
    .max(10_000_000),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a real date"),
});

export async function joinMilwordyAction(formData: FormData) {
  const userId = await requireUserId();
  const parsed = goalSchema.safeParse({
    targetWords: formData.get("targetWords"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return;

  await upsertMilwordyGoal(userId, parsed.data);
  revalidatePath("/progress");
}

export async function leaveMilwordyAction() {
  const userId = await requireUserId();
  await deleteMilwordyGoal(userId);
  revalidatePath("/progress");
}
