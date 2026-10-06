// Prompt, schéma de réponse et vérification des cartes générées par Gemini.

export const MIN_CARDS = 5;
export const MAX_CARDS = 30;
// Limite de coût : seul ce début du texte est envoyé à Gemini.
export const MAX_TEXT_CHARS = 30_000;
const MIN_EXCERPT_CHARS = 20;

export type Card = { question: string; answer: string; excerpt: string };

export function parseCardCount(value: unknown) {
  const count = Number(value);
  return Number.isInteger(count) && count >= MIN_CARDS && count <= MAX_CARDS ? count : null;
}

export function truncateText(text: string) {
  return text.slice(0, MAX_TEXT_CHARS);
}

export function buildPrompt(text: string, count: number) {
  return `Tu crées des cartes de révision à partir d'un document.

Règles :
- Produis exactement ${count} cartes.
- Chaque carte porte sur une information présente dans le document, sans rien inventer ni ajouter de connaissances extérieures.
- "question" : une question précise ; "answer" : la réponse, courte.
- "excerpt" : un passage COPIÉ MOT POUR MOT du corps du texte (une ou deux phrases complètes) qui justifie la réponse. Ne le reformule pas, ne le traduis pas. Ne cite pas un titre, un intertitre, le sommaire ou une légende.
- Rédige les questions et réponses dans la langue du document.

Document :
"""
${text}
"""`;
}

export function cardsJsonSchema(count: number) {
  const text = { type: "string" };
  return {
    type: "object",
    properties: {
      cards: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          properties: { question: text, answer: text, excerpt: text },
          required: ["question", "answer", "excerpt"],
        },
      },
    },
    required: ["cards"],
  };
}

// Le texte extrait d'un PDF est bruité : titres aux lettres espacées (« L ' E X P É R I E N C E »),
// mots coupés en fin de ligne (« années-⏎lumière »), guillemets et tirets typographiques.
// On compare donc sans casse, sans espaces, sans tirets ni guillemets, des deux côtés.
// Un extrait faisant au moins MIN_EXCERPT_CHARS caractères, le risque de faux positif est négligeable.
export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s­\-‐‑‒–—"'`«»“”‘’]/g, "");
}

export function validateCards(
  raw: string,
  sourceText: string,
  count: number,
): { cards: Card[] } | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "réponse JSON invalide" };
  }

  const items = (data as { cards?: unknown })?.cards;
  if (!Array.isArray(items)) return { error: "champ cards manquant" };
  if (items.length !== count) return { error: `${items.length} cartes reçues au lieu de ${count}` };

  const source = normalize(sourceText);
  const cards: Card[] = [];
  for (const [i, item] of items.entries()) {
    const { question, answer, excerpt } = (item ?? {}) as Record<string, unknown>;
    if (![question, answer, excerpt].every((v) => typeof v === "string" && v.trim())) {
      return { error: `carte ${i + 1} : champ manquant ou vide` };
    }
    const card = {
      question: (question as string).trim(),
      answer: (answer as string).trim(),
      excerpt: (excerpt as string).trim(),
    };
    if (card.excerpt.length < MIN_EXCERPT_CHARS) return { error: `carte ${i + 1} : extrait trop court` };
    if (!source.includes(normalize(card.excerpt))) {
      return { error: `carte ${i + 1} : extrait introuvable dans le document` };
    }
    cards.push(card);
  }
  return { cards };
}
