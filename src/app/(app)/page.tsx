import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { UploadForm } from "./upload-form";

export default async function HomePage() {
  const user = await requireUser();
  const documents = await listDocuments(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes documents</h1>
        <p className="mt-1 text-slate-600">Déposez un cours en PDF, générez des cartes, puis révisez.</p>
      </div>

      <UploadForm />

      <section aria-labelledby="documents-title">
        <h2 id="documents-title" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {documents.length} document{documents.length > 1 ? "s" : ""}
        </h2>
        {documents.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
            <p aria-hidden className="text-3xl">📄</p>
            <p className="mt-3 font-semibold">Aucun document pour l&apos;instant</p>
            <p className="mt-1 text-sm text-slate-500">
              Déposez votre premier PDF ci-dessus : ses cartes seront tirées de son texte.
            </p>
          </div>
        ) : (
          <ul className="panel mt-3 divide-y divide-slate-100 overflow-hidden">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5"
                >
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-50 text-[11px] font-bold text-rose-700"
                  >
                    PDF
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{doc.name}</span>
                    <span className="block text-sm text-slate-500">
                      Ajouté le {doc.createdAt.toLocaleDateString("fr-FR")}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      doc._count.cards > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {doc._count.cards > 0 ? `${doc._count.cards} cartes` : "Sans cartes"}
                  </span>
                  <span aria-hidden className="text-slate-400">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
