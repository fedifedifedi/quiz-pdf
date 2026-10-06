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

  test("refuse un JSON invalide ou sans tableau cards", () => {
    expect(validateCards("pas du json", SOURCE, 1)).toEqual({ error: "réponse JSON invalide" });
    expect(validateCards("{}", SOURCE, 1)).toEqual({ error: "champ cards manquant" });
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
