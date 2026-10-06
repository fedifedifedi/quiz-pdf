import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "../(auth)/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-3">
          <Link href="/" className="font-semibold">
            Quiz PDF
          </Link>
          <span className="ml-auto text-sm text-slate-500">{user.email}</span>
          <form action={logout}>
            <button className="text-sm text-slate-600 hover:text-slate-900">Déconnexion</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </>
  );
}
