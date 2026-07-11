import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { PurrCat } from "@/components/cat/purr-cat";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-plum-100 bg-cream-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/entries" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🐈‍⬛
            </span>
            <span className="font-serif text-lg font-semibold text-plum-900">
              Purrple Prose
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/entries"
              className="text-plum-700 transition hover:text-plum-900"
            >
              Entries
            </Link>
            <Link
              href="/progress"
              className="text-plum-700 transition hover:text-plum-900"
            >
              Progress
            </Link>
            <span className="text-plum-500">
              {session.user.name ?? session.user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-plum-200 px-3 py-1 text-plum-700 transition hover:bg-plum-100"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
      <PurrCat />
    </div>
  );
}
