import { describe, expect, test } from "vitest";
import { MAX_TEXT_CHARS, normalize, parseCardCount, truncateText, validateCards } from "@/lib/cards";

const SOURCE = `La mitochondrie est l’organite qui produit l’énergie de la cellule
sous forme d'ATP. La photo-
synthèse a lieu dans les chloroplastes des cellules végétales.`;

const card = (excerpt: string) => ({ question: "Q ?", answer: "R", excerpt });
const json = (cards: unknown[]) => JSON.stringify({ cards });

const VALID = [
  card("La mitochondrie est l'organite qui produit l'énergie"),
  card("La photosynthèse a lieu dans les chloroplastes"),
];

describe("validateCards", () => {
  test("accepte des cartes dont les extraits sont dans le texte", () => {
    const result = validateCards(json(VALID), SOURCE, 2);
    expect(result).toEqual({ cards: VALID });
  });

  test("refuse un nombre de cartes différent de celui demandé", () => {
    expect(validateCards(json(VALID), SOURCE, 3)).toEqual({ error: "2 cartes reçues au lieu de 3" });
  });

  test("refuse un extrait absent du texte (carte inventée)", () => {
    const cards = [VALID[0], card("La mitochondrie possède son propre noyau cellulaire")];
    expect(validateCards(json(cards), SOURCE, 2)).toEqual({
      error: "carte 2 : extrait introuvable dans le document",
    });
  });

  test("refuse un extrait trop court", () => {
    expect(validateCards(json([card("ATP")]), SOURCE, 1)).toEqual({
      error: "carte 1 : extrait trop court",
    });
  });

  test("refuse un champ manquant ou vide", () => {
    const cards = [{ question: "Q ?", answer: " ", excerpt: VALID[0].excerpt }];
    expect(validateCards(json(cards), SOURCE, 1)).toEqual({
      error: "carte 1 : champ manquant ou vide",
    });
  });

  test("retire la numérotation ajoutée par le modèle en tête de question", () => {
    const excerpt = VALID[0].excerpt;
    const questions = [
      ["1. En quelle année ?", "En quelle année ?"],
      ["12) Pourquoi ?", "Pourquoi ?"],
      ["Carte 3 : Comment ?", "Comment ?"],
      // Ne pas toucher à ce qui ressemble à un numéro mais n'en est pas un :
      ["1905 : que publie Einstein ?", "1905 : que publie Einstein ?"],
      ["1.5 fois plus lent ?", "1.5 fois plus lent ?"],
    ];
    const cards = questions.map(([question]) => ({ question, answer: "R", excerpt }));
    const result = validateCards(json(cards), SOURCE, questions.length);
    expect("cards" in result && result.cards.map((c) => c.question)).toEqual(questions.map(([, q]) => q));
  });

  test("refuse un JSON invalide ou sans tableau cards", () => {
    expect(validateCards("pas du json", SOURCE, 1)).toEqual({ error: "réponse JSON invalide" });
    expect(validateCards("{}", SOURCE, 1)).toEqual({ error: "champ cards manquant" });
  });
});

// Extraits tels que unpdf les produit sur cours-relativite.pdf (PDF réel de test).
const REAL_SOURCE = `C O U R S D E V U L G A R I S A T I O N
L ' E X P É R I E N C E D E M I C H E L S O N E T M O R L E Y ( 1 8 8 7 )
Sur Terre, quelqu'un qui vit au rez-de-
chaussée vieillit un tout petit peu moins vite que quelqu'un qui vit au dernier étage.
Un amas de masses solaires, à environ 1,3 milliard d'années-
lumière, qui forment un seul trou noir.`;

describe("validateCards sur du texte réel extrait d'un PDF", () => {
  test.each([
    ["mot composé coupé en fin de ligne", "quelqu'un qui vit au rez-de-chaussée vieillit un tout petit peu"],
    ["« années-lumière » coupé en fin de ligne", "à environ 1,3 milliard d'années-lumière, qui forment un seul trou noir"],
    ["titre aux lettres espacées", "L'expérience de Michelson et Morley (1887)"],
  ])("accepte un extrait fidèle : %s", (_, excerpt) => {
    expect(validateCards(json([card(excerpt)]), REAL_SOURCE, 1)).toEqual({ cards: [card(excerpt)] });
  });

  test("refuse toujours un extrait modifié", () => {
    const excerpt = "quelqu'un qui vit au rez-de-chaussée vieillit beaucoup plus vite";
    expect(validateCards(json([card(excerpt)]), REAL_SOURCE, 1)).toEqual({
      error: "carte 1 : extrait introuvable dans le document",
    });
  });
});

describe("normalize", () => {
  test("ignore casse, espaces, guillemets typographiques et césures", () => {
    expect(normalize("L’énergie  de\nla « cellule »")).toBe(normalize("l'Énergie de la cellule"));
    expect(normalize("photo-\nsynthèse")).toBe(normalize("photosynthèse"));
    expect(normalize("anti-\ninflammatoire")).toBe(normalize("anti-inflammatoire"));
    expect(normalize("A – B")).toBe(normalize("a - b"));
  });
});

describe("parseCardCount", () => {
  test("accepte un entier entre 5 et 30", () => {
    expect(parseCardCount("5")).toBe(5);
    expect(parseCardCount("30")).toBe(30);
  });

  test("refuse le reste", () => {
    for (const value of ["4", "31", "10.5", "abc", "", null]) expect(parseCardCount(value)).toBeNull();
  });
});

test("truncateText limite le texte envoyé à Gemini", () => {
  expect(truncateText("a".repeat(MAX_TEXT_CHARS + 10))).toHaveLength(MAX_TEXT_CHARS);
});
