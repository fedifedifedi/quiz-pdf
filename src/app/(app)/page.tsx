import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDocuments } from "@/lib/documents";
import { UploadForm } from "./upload-form";

export default async function HomePage() {
  const user = await requireUser();
  const documents = await listDocuments(user.id);

  return (
    <div className="space-y-8">
      <UploadForm />
      <section>
        <h1 className="text-xl font-semibold">Mes documents</h1>
        {documents.length === 0 ? (
          <p className="mt-3 text-slate-500">Aucun document pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-lg bg-white shadow">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-sm text-slate-500">
                    {doc._count.cards} cartes · {doc.createdAt.toLocaleDateString("fr-FR")}
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
