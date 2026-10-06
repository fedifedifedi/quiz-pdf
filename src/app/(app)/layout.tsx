import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "../(auth)/actions";
import { Logo } from "../logo";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6">
          <Link href="/" aria-label="Quiz PDF, mes documents" className="rounded-lg">
            <Logo />
          </Link>
          <Link href="/" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">
            Documents
          </Link>
          <Link href="/history" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Historique
          </Link>
          <span className="ml-auto hidden truncate text-sm text-slate-500 md:inline">{user.email}</span>
          <form action={logout} className="ml-auto md:ml-0">
            <button className="btn btn-secondary px-3 py-1.5">Déconnexion</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </>
  );
}
