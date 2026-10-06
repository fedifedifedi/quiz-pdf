import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCards, getDocument } from "@/lib/documents";
import { ReviewSession } from "./review-session";

export default async function ReviewPage({ params }: PageProps<"/documents/[id]/review">) {
  const user = await requireUser();
  const { id } = await params;
  const document = await getDocument(user.id, id);
  if (!document) notFound();
  const cards = await getCards(user.id, document.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/documents/${document.id}`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← {document.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Révision</h1>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
          <p className="font-semibold">Pas encore de cartes à réviser</p>
          <p className="mt-1 text-sm text-slate-500">Générez d&apos;abord les cartes de ce document.</p>
          <Link href={`/documents/${document.id}`} className="btn btn-primary mt-5">
            Générer les cartes
          </Link>
        </div>
      ) : (
        <ReviewSession documentId={document.id} cards={cards} />
      )}
    </div>
  );
}
