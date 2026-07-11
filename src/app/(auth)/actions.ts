"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { signIn } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Tell the cat your name").max(100),
  email: z.string().email("That doesn't look like an email").toLowerCase(),
  password: z.string().min(8, "Password needs at least 8 characters").max(200),
});

export type AuthFormState = { error?: string };

export async function signup(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  // Sign the new user straight in.
  await signIn("credentials", { email, password, redirectTo: "/entries" });
  return {};
}

export async function login(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/entries",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Wrong email or password" };
    }
    throw err; // redirect() throws internally — let it through
  }
}

export async function logout() {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirect: false });
  redirect("/login");
}
