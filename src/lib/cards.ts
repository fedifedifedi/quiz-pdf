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

// Pour une relance : questions déjà retenues (à ne pas répéter) et refus précédents (à corriger).
type Retry = { keptQuestions: string[]; rejected: string[] };

function retryRules({ keptQuestions, rejected }: Retry) {
  const section = (title: string, items: string[]) =>
    items.length ? `\n${title}\n${items.map((item) => `- ${item}`).join("\n")}\n` : "";
  return (
    section("Ces questions sont déjà retenues, ne les répète pas :", keptQuestions) +
    section("Ces cartes ont été refusées, ne refais pas ces erreurs :", rejected)
  );
}

export function buildPrompt(text: string, count: number, retry?: Retry) {
  return `Tu crées des cartes de révision à partir d'un document.

Règles :
- Produis exactement ${count} carte(s), réparties sur l'ensemble du document (début, milieu et fin).
- Privilégie les notions clés et leurs explications plutôt que les détails anecdotiques (dates, noms).
- Une notion différente par carte : jamais deux cartes sur le même passage.
- N'utilise que le document : n'invente rien, n'ajoute aucune connaissance extérieure.
- "question" : une question précise.
- "answer" : une réponse complète mais concise ; pour une expérience, donne son résultat, pas seulement sa méthode.
- "excerpt" : la phrase du corps du texte qui contient la réponse, COPIÉE MOT POUR MOT (une ou deux phrases complètes). Jamais un titre, un sous-titre, le sommaire ou une légende.
- Rédige dans la langue du document.
${retry ? retryRules(retry) : ""}
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

// Vérifie chaque carte séparément : les cartes valides sont gardées, chaque refus est expliqué
// (avec l'extrait tronqué) pour le journal et pour la relance. Le nombre est géré par l'appelant.
// keptExcerpts : extraits des cartes déjà retenues (appels précédents), pour refuser les doublons.
export function validateCards(
  raw: string,
  sourceText: string,
  keptExcerpts: string[] = [],
): { cards: Card[]; rejected: string[] } | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "réponse JSON invalide" };
  }

  const items = (data as { cards?: unknown })?.cards;
  if (!Array.isArray(items)) return { error: "champ cards manquant" };

  const source = normalize(sourceText);
  // Titres et sous-titres : lignes isolées sans ponctuation finale (« Le temps ralentit quand on va vite »).
  const titles = new Set(
    sourceText
      .split("\n")
      .filter((line) => !/[.!?…]\s*$/.test(line))
      .map(normalize),
  );
  const rejectionReason = (excerpt: string) => {
    if (excerpt.length < MIN_EXCERPT_CHARS) return "extrait trop court";
    if (!source.includes(normalize(excerpt))) return "extrait introuvable dans le document (pas copié mot pour mot)";
    if (titles.has(normalize(excerpt))) return "l'extrait est un titre, pas une phrase du texte";
    return null;
  };

  const cards: Card[] = [];
  const rejected: string[] = [];
  const usedExcerpts = new Set(keptExcerpts.map(normalize));
  for (const item of items) {
    const { question, answer, excerpt } = (item ?? {}) as Record<string, unknown>;
    if (![question, answer, excerpt].every((v) => typeof v === "string" && v.trim())) {
      rejected.push("champ manquant ou vide");
      continue;
    }
    const card = {
      question: (question as string).trim(),
      answer: (answer as string).trim(),
      excerpt: (excerpt as string).trim(),
    };
    const reason =
      rejectionReason(card.excerpt) ??
      (usedExcerpts.has(normalize(card.excerpt)) ? "doublon : même extrait qu'une autre carte" : null);
    if (reason) {
      rejected.push(`${reason} : « ${card.excerpt.slice(0, 100)} »`);
    } else {
      usedExcerpts.add(normalize(card.excerpt));
      cards.push(card);
    }
  }
  return { cards, rejected };
}
