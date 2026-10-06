import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { MAX_TEXT_CHARS } from "@/lib/cards";
import { getDocument } from "@/lib/documents";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const user = await requireUser();
  const document = await getDocument(user.id, (await params).id);
  if (!document) notFound();

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
    </div>
  );
}
