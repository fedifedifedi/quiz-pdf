import { buildPrompt, cardsJsonSchema, truncateText, validateCards } from "@/lib/cards";
import { getDocument, replaceCards } from "@/lib/documents";
import { callGemini } from "@/lib/gemini";

export type Step = "extraction" | "generation" | "verification";

const MAX_ATTEMPTS = 2;

// Génère, vérifie et enregistre les cartes d'un document de l'utilisateur.
// onStep signale chaque étape à l'interface ; les cartes existantes ne changent qu'en cas de succès.
export async function generateCards(
  userId: string,
  documentId: string,
  count: number,
  onStep: (step: Step) => void,
): Promise<{ count: number } | { error: string }> {
  onStep("extraction");
  const document = await getDocument(userId, documentId);
  if (!document) return { error: "Document introuvable." };
  const text = truncateText(document.text);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    onStep("generation");
    const raw = await callGemini(buildPrompt(text, count), cardsJsonSchema(count));

    onStep("verification");
    const result = validateCards(raw, text, count);
    if ("cards" in result) {
      await replaceCards(userId, document.id, result.cards);
      return { count };
    }
    console.warn(`Cartes rejetées (tentative ${attempt}/${MAX_ATTEMPTS}) : ${result.error}`);
  }
  return {
    error: "Gemini n'a pas produit de cartes fidèles au document (extraits introuvables). Réessayez.",
  };
}
