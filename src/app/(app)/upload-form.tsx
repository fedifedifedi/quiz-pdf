"use client";

import { useActionState, useState } from "react";
import { type UploadState, uploadDocument } from "./actions";

const MAX_MB = 10;

export function UploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined);
  const [clientError, setClientError] = useState("");
  const [fileName, setFileName] = useState("");
  const error = clientError || state?.error;

  return (
    // React vide le champ fichier après l'envoi : on efface aussi le nom affiché.
    <form action={action} onSubmit={() => setFileName("")} className="panel p-5 sm:p-6">
      <h2 className="font-semibold">Ajouter un document</h2>
      <p className="mt-1 text-sm text-slate-500">PDF texte, 10 Mo maximum. Les PDF scannés ne sont pas pris en charge.</p>

      {/* Le champ fichier, transparent, couvre toute la zone : clic et glisser-déposer natifs. */}
      <div className="relative mt-4 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-indigo-600">
        <input
          name="file"
          type="file"
          accept=".pdf,application/pdf"
          required
          aria-label="Choisir un fichier PDF"
          // Contrôle immédiat de la taille, sans attendre l'envoi ; le serveur revérifie.
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileName(file?.name ?? "");
            setClientError(
              file && file.size > MAX_MB * 1024 * 1024
                ? `Le fichier dépasse la taille maximale de ${MAX_MB} Mo.`
                : "",
            );
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <div aria-hidden className="mx-auto grid size-11 place-items-center rounded-full bg-indigo-50 text-xl text-indigo-600">
          ↑
        </div>
        {fileName ? (
          <p className="mt-3 truncate text-sm font-semibold text-slate-900">{fileName}</p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-semibold text-indigo-600">Choisissez un PDF</span> ou glissez-le ici
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="alert alert-error mt-4">
          {error}
        </p>
      )}
      <button disabled={pending || !!clientError} className="btn btn-primary mt-4 w-full sm:w-auto">
        {pending && <span className="spinner" aria-hidden />}
        {pending ? "Extraction du texte…" : "Envoyer"}
      </button>
    </form>
  );
}
