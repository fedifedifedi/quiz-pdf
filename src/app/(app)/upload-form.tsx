"use client";

import { useActionState, useState } from "react";
import { type UploadState, uploadDocument } from "./actions";

const MAX_MB = 10;

export function UploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined);
  const [clientError, setClientError] = useState("");
  const error = clientError || state?.error;

  return (
    <form action={action} className="rounded-lg bg-white p-6 shadow">
      <label className="block text-sm font-medium text-slate-700">
        Déposer un PDF (10 Mo max.)
        <input
          name="file"
          type="file"
          accept=".pdf,application/pdf"
          required
          // Contrôle immédiat de la taille, sans attendre l'envoi ; le serveur revérifie.
          onChange={(e) => {
            const file = e.target.files?.[0];
            setClientError(
              file && file.size > MAX_MB * 1024 * 1024
                ? `Le fichier dépasse la taille maximale de ${MAX_MB} Mo.`
                : "",
            );
          }}
          className="mt-2 block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-slate-100 file:px-4 file:py-2"
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        disabled={pending || !!clientError}
        className="mt-4 rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Extraction du texte…" : "Envoyer"}
      </button>
    </form>
  );
}
