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

  if (result) return <Score result={result} documentId={documentId} onRestart={restart} />;

  const face = "panel col-start-1 row-start-1 flex min-h-72 flex-col p-6 backface-hidden sm:p-8";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="shrink-0">
          Carte {index + 1} sur {cards.length}
        </span>
        <div
          role="progressbar"
          aria-label="Avancement de la séance"
          aria-valuemin={0}
          aria-valuemax={cards.length}
          aria-valuenow={index}
          className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(index / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Carte recto/verso : deux faces superposées, retournées en 3D. La clé remonte la carte à
          chaque question, pour ne jamais animer (ni dévoiler) le verso de la carte suivante. */}
      <div className="perspective-distant">
        <div
          key={card.id}
          className={`grid transition-transform duration-500 transform-3d motion-reduce:transition-none ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          <section aria-hidden={flipped} className={face}>
            <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">Question</p>
            <p className="my-auto py-6 text-center text-xl leading-relaxed font-semibold text-balance sm:text-2xl">
              {card.question}
            </p>
          </section>
          <section aria-hidden={!flipped} className={`${face} rotate-y-180`}>
            <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">Réponse</p>
            <p className="mt-2 text-sm text-slate-500">{card.question}</p>
            <p className="mt-4 text-lg leading-relaxed text-slate-900">{card.answer}</p>
            <blockquote className="mt-auto rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Source : </span>
              {card.excerpt}
            </blockquote>
          </section>
        </div>
      </div>

      {!flipped ? (
        <button onClick={() => setFlipped(true)} className="btn btn-primary w-full py-3.5 text-base">
          Retourner la carte
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => answer(false)}
            disabled={saving}
            className="btn bg-rose-600 py-3.5 text-base text-white shadow-sm hover:bg-rose-700"
          >
            <span aria-hidden>✕</span> Faux
          </button>
          <button
            onClick={() => answer(true)}
            disabled={saving}
            className="btn bg-emerald-700 py-3.5 text-base text-white shadow-sm hover:bg-emerald-800"
          >
            {saving ? <span className="spinner" aria-hidden /> : <span aria-hidden>✓</span>} Bon
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
    </div>
  );
}

function Score({ result, documentId, onRestart }: { result: Result; documentId: string; onRestart: () => void }) {
  const tier =
    result.score >= 80
      ? { message: "Excellent travail !", color: "text-emerald-700" }
      : result.score >= 50
        ? { message: "Bon travail, continuez !", color: "text-indigo-600" }
        : { message: "À retravailler : relancez une séance.", color: "text-amber-700" };
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="panel px-6 py-10 text-center sm:px-10">
      <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Séance terminée</p>
      <div className={`relative mx-auto mt-6 size-44 ${tier.color}`}>
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-slate-100" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - result.score / 100)}
          />
        </svg>
        <p className="absolute inset-0 grid place-items-center text-4xl font-bold text-slate-900">
          {result.score} %
        </p>
      </div>
      <p className={`mt-5 text-xl font-semibold ${tier.color}`}>{tier.message}</p>
      <p className="mt-1 text-slate-600">
        {result.correct} bonne{result.correct > 1 ? "s" : ""} réponse{result.correct > 1 ? "s" : ""} sur{" "}
        {result.total}
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onRestart} className="btn btn-primary">
          Recommencer
        </button>
        <Link href="/history" className="btn btn-secondary">
          Voir l&apos;historique
        </Link>
        <Link href={`/documents/${documentId}`} className="btn btn-secondary">
          Retour au document
        </Link>
      </div>
    </div>
  );
}
