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
const NOT_FOUND = "extrait introuvable dans le document (pas copié mot pour mot)";
const TITLE = "l'extrait est un titre, pas une phrase du texte";

describe("validateCards", () => {
  test("accepte des cartes dont les extraits sont dans le texte", () => {
    expect(validateCards(json(VALID), SOURCE)).toEqual({ cards: VALID, rejected: [] });
  });

  test("garde les cartes valides et explique le refus des autres", () => {
    const invented = card("La mitochondrie possède son propre noyau cellulaire");
    expect(validateCards(json([VALID[0], invented, VALID[1]]), SOURCE)).toEqual({
      cards: VALID,
      rejected: [`${NOT_FOUND} : « La mitochondrie possède son propre noyau cellulaire »`],
    });
  });

  test("refuse un extrait trop court ou un champ vide", () => {
    const emptyAnswer = { question: "Q ?", answer: " ", excerpt: VALID[0].excerpt };
    expect(validateCards(json([card("ATP"), emptyAnswer]), SOURCE)).toEqual({
      cards: [],
      rejected: ["extrait trop court : « ATP »", "champ manquant ou vide"],
    });
  });

  test("tronque l'extrait refusé à 100 caractères dans le message", () => {
    const long = "Cet extrait inventé est très long. ".repeat(10);
    const result = validateCards(json([card(long)]), SOURCE);
    expect(result).toEqual({ cards: [], rejected: [`${NOT_FOUND} : « ${long.trim().slice(0, 100)} »`] });
  });

  test("refuse un JSON invalide ou sans tableau cards", () => {
    expect(validateCards("pas du json", SOURCE)).toEqual({ error: "réponse JSON invalide" });
    expect(validateCards("{}", SOURCE)).toEqual({ error: "champ cards manquant" });
  });
});

// Extraits tels que unpdf les produit sur cours-relativite.pdf (PDF réel de test).
const REAL_SOURCE = `C O U R S D E V U L G A R I S A T I O N
L ' E X P É R I E N C E D E M I C H E L S O N E T M O R L E Y ( 1 8 8 7 )
Sur Terre, quelqu'un qui vit au rez-de-
chaussée vieillit un tout petit peu moins vite que quelqu'un qui vit au dernier étage.
Un amas de masses solaires, à environ 1,3 milliard d'années-
lumière, qui forment un seul trou noir.
voient raccourcir ce qui défile autour d'eux.
La simultanéité est relative
Un train passe devant vous. Au moment où son milieu est en face de vous, deux éclairs frappent ses deux
extrémités.`;

describe("validateCards sur du texte réel extrait d'un PDF", () => {
  test.each([
    ["mot composé coupé en fin de ligne", "quelqu'un qui vit au rez-de-chaussée vieillit un tout petit peu"],
    ["« années-lumière » coupé en fin de ligne", "à environ 1,3 milliard d'années-lumière, qui forment un seul trou noir"],
    ["phrase qui suit un sous-titre", "Au moment où son milieu est en face de vous, deux éclairs frappent ses deux extrémités."],
    // Phrase coupée par un retour à la ligne du PDF : ce n'est pas un titre.
    ["phrase sur deux lignes, sans point final", "Au moment où son milieu est en face de vous, deux éclairs frappent ses deux extrémités"],
  ])("accepte un extrait fidèle : %s", (_, excerpt) => {
    expect(validateCards(json([card(excerpt)]), REAL_SOURCE)).toEqual({ cards: [card(excerpt)], rejected: [] });
  });

  test.each([
    ["sous-titre", "La simultanéité est relative"],
    ["titre aux lettres espacées", "L'expérience de Michelson et Morley (1887)"],
  ])("refuse un extrait qui est un titre : %s", (_, excerpt) => {
    expect(validateCards(json([card(excerpt)]), REAL_SOURCE)).toEqual({
      cards: [],
      rejected: [`${TITLE} : « ${excerpt} »`],
    });
  });

  test("refuse toujours un extrait modifié", () => {
    const excerpt = "quelqu'un qui vit au rez-de-chaussée vieillit beaucoup plus vite";
    expect(validateCards(json([card(excerpt)]), REAL_SOURCE)).toEqual({
      cards: [],
      rejected: [`${NOT_FOUND} : « ${excerpt} »`],
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
