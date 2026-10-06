import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { MAX_TEXT_CHARS } from "@/lib/cards";
import { getCards, getDocument } from "@/lib/documents";
import { GenerateForm } from "./generate-form";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const document = await getDocument(user.id, id);
  if (!document) notFound();
  const cards = await getCards(user.id, document.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
          ← Mes documents
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight break-words">{document.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ajouté le {document.createdAt.toLocaleDateString("fr-FR")} ·{" "}
          {document.text.length.toLocaleString("fr-FR")} caractères extraits
        </p>
      </div>

      {document.text.length > MAX_TEXT_CHARS && (
        <p className="alert alert-warning">
          <strong className="font-semibold">Document long :</strong> seuls les{" "}
          {MAX_TEXT_CHARS.toLocaleString("fr-FR")} premiers caractères (sur{" "}
          {document.text.length.toLocaleString("fr-FR")}) seront utilisés pour générer les cartes.
        </p>
      )}

      <GenerateForm documentId={document.id} hasCards={cards.length > 0} />

      {cards.length > 0 && (
        <section aria-labelledby="cards-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="cards-title" className="text-lg font-semibold">
              {cards.length} cartes
            </h2>
            <Link href={`/documents/${document.id}/review`} className="btn btn-primary">
              Réviser ces cartes →
            </Link>
          </div>
          {/* Numérotation par la liste elle-même (une seule source de numéros). */}
          <ol className="mt-4 list-decimal space-y-3 pl-7 marker:font-semibold marker:text-slate-500">
            {cards.map((card) => (
              <li key={card.id} className="panel p-4 pl-5 sm:p-5">
                <p className="font-semibold">{card.question}</p>
                <p className="mt-1.5 text-slate-700">{card.answer}</p>
                <blockquote className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Source : </span>
                  {card.excerpt}
                </blockquote>
              </li>
            ))}
          </ol>
        </section>
      )}

      <details className="panel p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Voir le texte extrait du PDF</summary>
        <p className="mt-3 max-h-96 overflow-y-auto text-sm whitespace-pre-wrap text-slate-600">{document.text}</p>
      </details>
    </div>
  );
}
