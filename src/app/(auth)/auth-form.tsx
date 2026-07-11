"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "./actions";

type Props = {
  mode: "login" | "signup";
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mb-2 text-5xl" aria-hidden>
          🐈‍⬛
        </div>
        <h1 className="font-serif text-3xl text-plum-900">Purrple Prose</h1>
        <p className="mt-1 text-sm text-plum-500">
          {mode === "login"
            ? "The cat has been waiting for you."
            : "A sleepy familiar for your stories."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-1 block text-sm text-plum-700">Name</span>
            <input
              name="name"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-plum-200 bg-white/70 px-3 py-2 text-plum-900 outline-none focus:border-plum-400"
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm text-plum-700">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-plum-200 bg-white/70 px-3 py-2 text-plum-900 outline-none focus:border-plum-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-plum-700">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : 1}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-plum-200 bg-white/70 px-3 py-2 text-plum-900 outline-none focus:border-plum-400"
          />
        </label>

        {state.error && (
          <p className="text-sm text-rose-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-plum-700 py-2.5 font-medium text-white transition hover:bg-plum-800 disabled:opacity-50"
        >
          {pending
            ? "…"
            : mode === "login"
              ? "Curl back in"
              : "Join the cat"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-plum-500">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-plum-700 underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-plum-700 underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
