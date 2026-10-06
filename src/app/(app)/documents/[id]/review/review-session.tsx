"use client";

import Link from "next/link";
import { useState } from "react";
import { finishReview } from "./actions";

type Card = { id: string; question: string; answer: string; excerpt: string };
type Result = { correct: number; total: number; score: number };

export function ReviewSession({ documentId, cards }: { documentId: string; cards: Card[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const card = cards[index];

  async function answer(isCorrect: boolean) {
    const ids = isCorrect ? [...correctIds, card.id] : correctIds;
    setCorrectIds(ids);
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
      return;
    }
    // Dernière carte : le serveur recalcule et enregistre le score.
    setSaving(true);
    const saved = await finishReview(documentId, ids).catch(() => null);
    setSaving(false);
    if (saved) setResult(saved);
    else setError("Le score n'a pas pu être enregistré. Réessayez.");
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setCorrectIds([]);
    setResult(null);
    setError("");
  }

  if (result) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-sm text-slate-500">Score final</p>
        <p className="mt-2 text-5xl font-bold text-indigo-600">{result.score} %</p>
        <p className="mt-2 text-slate-600">
          {result.correct} bonne{result.correct > 1 ? "s" : ""} réponse{result.correct > 1 ? "s" : ""} sur{" "}
          {result.total}
        </p>
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <button onClick={restart} className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            Recommencer
          </button>
          <Link href="/history" className="rounded border border-slate-300 px-4 py-2 hover:bg-slate-50">
            Voir l&apos;historique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Carte {index + 1} / {cards.length}
        </span>
        <div className="h-2 flex-1 rounded bg-slate-200">
          <div className="h-2 rounded bg-indigo-500" style={{ width: `${(index / cards.length) * 100}%` }} />
        </div>
      </div>

      <div className="min-h-48 rounded-lg bg-white p-8 shadow">
        <p className="text-xs uppercase tracking-wide text-slate-400">{flipped ? "Verso" : "Recto"}</p>
        <p className="mt-3 text-lg font-medium">{card.question}</p>
        {flipped && (
          <>
            <p className="mt-4 border-t border-slate-200 pt-4 text-slate-800">{card.answer}</p>
            <blockquote className="mt-3 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-500">
              « {card.excerpt} »
            </blockquote>
          </>
        )}
      </div>

      {!flipped ? (
        <button
          onClick={() => setFlipped(true)}
          className="w-full rounded bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700"
        >
          Retourner la carte
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => answer(false)}
            disabled={saving}
            className="rounded bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Faux
          </button>
          <button
            onClick={() => answer(true)}
            disabled={saving}
            className="rounded bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Bon
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
