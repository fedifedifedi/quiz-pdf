import { buildPrompt, type Card, cardsJsonSchema, truncateText, validateCards } from "@/lib/cards";
import { getDocument, replaceCards } from "@/lib/documents";
import { callGemini } from "@/lib/gemini";

export type Step = "extraction" | "generation" | "verification";

// Après le premier appel, on ne redemande que les cartes manquantes, au plus 2 fois.
const MAX_RETRIES = 2;

// Génère, vérifie et enregistre les cartes d'un document de l'utilisateur.
// Les cartes valides sont gardées d'un appel à l'autre ; si certaines manquent encore à la fin,
// les cartes valides sont enregistrées quand même. Les cartes existantes ne changent que si au
// moins une carte est valide.
export async function generateCards(
  userId: string,
  documentId: string,
  count: number,
  onStep: (step: Step) => void,
): Promise<{ count: number; requested: number } | { error: string }> {
  onStep("extraction");
  const document = await getDocument(userId, documentId);
  if (!document) return { error: "Document introuvable." };
  const text = truncateText(document.text);

  const cards: Card[] = [];
  let rejected: string[] = [];
  for (let attempt = 0; attempt <= MAX_RETRIES && cards.length < count; attempt++) {
    const missing = count - cards.length;
    const retry = attempt > 0 ? { keptQuestions: cards.map((c) => c.question), rejected } : undefined;

    onStep("generation");
    const raw = await callGemini(buildPrompt(text, missing, retry), cardsJsonSchema(missing));

    onStep("verification");
    const result = validateCards(
      raw,
      text,
      cards.map((c) => c.excerpt),
    );
    rejected = "error" in result ? [result.error] : result.rejected;
    if ("cards" in result) cards.push(...result.cards.slice(0, missing));
    for (const reason of rejected) console.warn(`Carte refusée (appel ${attempt + 1}) : ${reason}`);
  }

  if (cards.length === 0) {
    return { error: "Gemini n'a produit aucune carte fidèle au document. Réessayez." };
  }
  await replaceCards(userId, document.id, cards);
  return { count: cards.length, requested: count };
}
