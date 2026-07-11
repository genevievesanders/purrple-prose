import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/entries");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream-50 to-plum-50 px-4">
      {children}
    </main>
  );
}
