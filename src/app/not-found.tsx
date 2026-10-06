import Link from "next/link";

// Affichée aussi quand un utilisateur ouvre le document d'un autre (on ne révèle pas qu'il existe).
export default function NotFound() {
  return (
    <main className="flex flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-indigo-600">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-slate-600">Ce document n&apos;existe pas ou ne vous appartient pas.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Retour à mes documents
      </Link>
    </main>
  );
}
