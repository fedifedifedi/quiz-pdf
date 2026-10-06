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
    <div className="space-y-4">
      <Link href={`/documents/${document.id}`} className="text-sm text-indigo-600 hover:underline">
        ← {document.name}
      </Link>
      <h1 className="text-xl font-semibold">Révision</h1>
      {cards.length === 0 ? (
        <p className="text-slate-500">Ce document n&apos;a pas encore de cartes : générez-les d&apos;abord.</p>
      ) : (
        <ReviewSession documentId={document.id} cards={cards} />
      )}
    </div>
  );
}
