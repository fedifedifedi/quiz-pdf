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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{document.name}</h1>
      <p className="text-sm text-slate-500">
        Ajouté le {document.createdAt.toLocaleDateString("fr-FR")} ·{" "}
        {document.text.length.toLocaleString("fr-FR")} caractères extraits
      </p>
      {document.text.length > MAX_TEXT_CHARS && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Document long : seuls les {MAX_TEXT_CHARS.toLocaleString("fr-FR")} premiers caractères (sur{" "}
          {document.text.length.toLocaleString("fr-FR")}) seront utilisés pour générer les cartes.
        </p>
      )}
      <details className="rounded-lg bg-white p-4 shadow">
        <summary className="cursor-pointer text-sm font-medium">Texte extrait</summary>
        <p className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
          {document.text}
        </p>
      </details>

      <GenerateForm documentId={document.id} hasCards={cards.length > 0} />

      {cards.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">{cards.length} cartes</h2>
          {/* Numérotation par la liste elle-même (une seule source de numéros). */}
          <ol className="mt-3 list-decimal space-y-3 pl-6 marker:font-medium marker:text-slate-500">
            {cards.map((card) => (
              <li key={card.id} className="rounded-lg bg-white p-4 shadow">
                <p className="font-medium">{card.question}</p>
                <p className="mt-1 text-slate-700">{card.answer}</p>
                <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-500">
                  « {card.excerpt} »
                </blockquote>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
