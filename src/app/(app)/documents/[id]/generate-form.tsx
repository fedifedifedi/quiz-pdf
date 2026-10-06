"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Step } from "@/lib/generation";

const STEPS: { id: Step; label: string }[] = [
  { id: "extraction", label: "Extraction du texte" },
  { id: "generation", label: "Génération par Gemini" },
  { id: "verification", label: "Vérification des extraits" },
];

type Event = { step: Step } | { done: number } | { error: string };

export function GenerateForm({ documentId, hasCards }: { documentId: string; hasCards: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  // Nombre de cartes générées : les étapes restent affichées (toutes cochées) après la fin,
  // pour que chacune soit lisible même quand elle ne dure que quelques millisecondes.
  const [generated, setGenerated] = useState<number | null>(null);

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
            setGenerated(event.done);
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
    <form action={generate} className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium text-slate-700">
          Nombre de cartes (5 à 30)
          <input
            name="count"
            type="number"
            min={5}
            max={30}
            defaultValue={10}
            required
            className="mt-1 block w-28 rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          disabled={running}
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {hasCards ? "Regénérer les cartes" : "Générer les cartes"}
        </button>
      </div>
      {hasCards && !running && (
        <p className="mt-2 text-xs text-slate-500">Une nouvelle génération remplace les cartes actuelles.</p>
      )}

      {(running || generated !== null || (error && current >= 0)) && (
        <ol className="mt-5 space-y-2 text-sm" aria-live="polite">
          {STEPS.map((s, i) => {
            const state = stepState(i);
            return (
              <li key={s.id} className="flex items-center gap-2">
                <span
                  className={
                    {
                      done: "text-green-600",
                      active: "animate-pulse text-indigo-600",
                      failed: "text-red-600",
                      pending: "text-slate-300",
                    }[state]
                  }
                >
                  {{ done: "✓", active: "●", failed: "✗", pending: "○" }[state]}
                </span>
                <span className={state === "pending" ? "text-slate-400" : ""}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}
      {generated !== null && (
        <p className="mt-3 text-sm font-medium text-green-700">
          {generated} cartes générées, extraits vérifiés dans le document.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
