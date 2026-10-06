"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_CARDS, MIN_CARDS } from "@/lib/cards";
import type { Step } from "@/lib/generation";

const STEPS: { id: Step; label: string; detail: string }[] = [
  { id: "extraction", label: "Lecture du document", detail: "Préparation du texte extrait du PDF." },
  { id: "generation", label: "Rédaction des cartes", detail: "Gemini choisit les notions clés et rédige questions et réponses." },
  { id: "verification", label: "Vérification des sources", detail: "Chaque extrait est recherché mot pour mot dans le document." },
];

type Result = { done: number; requested: number };
type Event = { step: Step } | Result | { error: string };

export function GenerateForm({ documentId, hasCards }: { documentId: string; hasCards: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  // Résultat final : les étapes restent affichées (toutes cochées) après la fin,
  // pour que chacune soit lisible même quand elle ne dure que quelques millisecondes.
  const [generated, setGenerated] = useState<Result | null>(null);

  async function generate(formData: FormData) {
    setRunning(true);
    setError("");
    setStep(null);
    setGenerated(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, count: Number(formData.get("count")) }),
      });
      if (!res.ok || !res.body) {
        setError((await res.json().catch(() => null))?.error ?? "Erreur inattendue.");
        return;
      }

      // Lecture du flux NDJSON : une ligne = un événement.
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line) as Event;
          if ("step" in event) setStep(event.step);
          else if ("error" in event) setError(event.error);
          else {
            setGenerated(event);
            router.refresh();
          }
        }
      }
    } catch {
      setError("Connexion au serveur perdue. Réessayez.");
    } finally {
      setRunning(false);
    }
  }

  const current = STEPS.findIndex((s) => s.id === step);
  const stepState = (i: number) => {
    if (generated !== null || i < current) return "done";
    if (i > current) return "pending";
    return error ? "failed" : "active";
  };

  return (
    // onSubmit plutôt qu'une action de formulaire : React n'afficherait les états intermédiaires
    // d'une action (étapes, bouton désactivé) qu'à la fin de la génération.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        generate(new FormData(e.currentTarget));
      }}
      className="panel p-5 sm:p-6"
    >
      <h2 className="font-semibold">{hasCards ? "Regénérer les cartes" : "Générer les cartes"}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {hasCards
          ? "Une nouvelle génération remplace les cartes actuelles."
          : "Les questions, réponses et extraits sont tirés uniquement du texte du document."}
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="label">
          Nombre de cartes ({MIN_CARDS} à {MAX_CARDS})
          <input
            name="count"
            type="number"
            min={MIN_CARDS}
            max={MAX_CARDS}
            defaultValue={10}
            required
            className="input w-28"
          />
        </label>
        <button disabled={running} className={`btn ${hasCards ? "btn-secondary" : "btn-primary"}`}>
          {running && <span className="spinner" aria-hidden />}
          {running ? "Génération en cours…" : hasCards ? "Regénérer les cartes" : "Générer les cartes"}
        </button>
      </div>

      {(running || generated !== null || (error && current >= 0)) && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          {running && (
            <div className="mb-5" aria-hidden>
              <p className="mb-2 text-sm text-slate-600">L&apos;IA travaille sur votre document, cela prend généralement quelques secondes.</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                <div className="h-full w-1/3 animate-progress rounded-full bg-indigo-500 motion-reduce:animate-none" />
              </div>
            </div>
          )}
          <ol className="space-y-4" aria-live="polite" aria-label="Progression de la génération">
            {STEPS.map((s, i) => {
              const state = stepState(i);
              return (
                <li key={s.id} className="flex gap-3">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      {
                        done: "bg-emerald-600 text-white",
                        active: "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-600",
                        failed: "bg-rose-600 text-white",
                        pending: "bg-white text-slate-500 ring-1 ring-slate-300",
                      }[state]
                    }`}
                  >
                    {state === "active" ? <span className="spinner size-3.5" /> : { done: "✓", failed: "✕", pending: i + 1 }[state]}
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${state === "pending" ? "text-slate-500" : "text-slate-900"}`}>
                      {s.label}
                      <span className="sr-only">
                        {{ done: " : terminé", active: " : en cours", failed: " : échec", pending: " : à venir" }[state]}
                      </span>
                    </span>
                    <span className="block text-sm text-slate-500">{s.detail}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {generated &&
        (generated.done === generated.requested ? (
          <p className="alert alert-success mt-5">
            <strong className="font-semibold">{generated.done} cartes générées</strong>, extraits vérifiés dans le document.
          </p>
        ) : (
          <p className="alert alert-warning mt-5">
            <strong className="font-semibold">
              {generated.done} cartes générées sur {generated.requested} demandées
            </strong>{" "}
            : les autres n&apos;ont pas pu être vérifiées dans le document. Vous pouvez relancer la génération.
          </p>
        ))}
      {error && (
        <p role="alert" className="alert alert-error mt-5">
          {error}
        </p>
      )}
    </form>
  );
}
