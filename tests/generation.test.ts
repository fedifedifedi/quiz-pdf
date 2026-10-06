import { beforeEach, describe, expect, test, vi } from "vitest";
import { MAX_TEXT_CHARS } from "@/lib/cards";
import { createDocument, getCards, replaceCards } from "@/lib/documents";
import { callGemini } from "@/lib/gemini";
import { generateCards, type Step } from "@/lib/generation";
import { createUser, makePdf } from "./helpers";

// Faux provider : uniquement dans les tests, l'application appelle toujours le vrai Gemini.
vi.mock("@/lib/gemini", () => ({ callGemini: vi.fn() }));
const gemini = vi.mocked(callGemini);

const SENTENCES = [
  "La vitesse de la lumière dans le vide est la même pour tous les observateurs.",
  "Un objet qui a une masse ne peut jamais atteindre la vitesse de la lumière.",
  "Le temps s'écoule plus lentement pour une horloge en mouvement rapide.",
  "Les muons créés en haute atmosphère atteignent le sol grâce à la dilatation du temps.",
  "La masse est une forme d'énergie, comme le résume la formule E = mc².",
  "Le jumeau qui voyage revient plus jeune que celui resté sur Terre.",
  "Les satellites GPS doivent corriger leurs horloges pour rester précis.",
  "Une masse importante courbe l'espace-temps autour d'elle.",
  "Rien, pas même la lumière, ne peut sortir de l'horizon d'un trou noir.",
  "Les ondes gravitationnelles ont été détectées pour la première fois en 2015.",
];
const TEXT = SENTENCES.join("\n");
const INVENTED = "La lumière ralentit fortement dans le vide spatial.";

const cardsJson = (excerpts: string[]) =>
  JSON.stringify({ cards: excerpts.map((excerpt, i) => ({ question: `Question ${i} ?`, answer: "R", excerpt })) });

// Nombre de cartes demandées à Gemini lors de l'appel n (lu dans le schéma JSON envoyé).
const requestedAt = (n: number) =>
  (gemini.mock.calls[n][1] as { properties: { cards: { minItems: number } } }).properties.cards.minItems;

let n = 0;
async function setup(text = TEXT) {
  n++;
  const alice = await createUser(`alice-gen${n}@test.fr`);
  const bob = await createUser(`bob-gen${n}@test.fr`);
  const doc = await createDocument(alice.id, { name: "cours.pdf", file: makePdf(), text });
  return { alice, bob, doc };
}

beforeEach(() => {
  gemini.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("generateCards", () => {
  test("génère, vérifie et enregistre les cartes en signalant chaque étape", async () => {
    const { alice, doc } = await setup();
    gemini.mockResolvedValueOnce(cardsJson(SENTENCES));
    const steps: Step[] = [];

    expect(await generateCards(alice.id, doc.id, 10, (s) => steps.push(s))).toEqual({ count: 10, requested: 10 });
    expect(steps).toEqual(["extraction", "generation", "verification"]);
    expect((await getCards(alice.id, doc.id)).map((c) => c.excerpt)).toEqual(SENTENCES);
  });

  test("10 cartes dont 1 invalide : seule la carte manquante est redemandée, avec la raison du refus", async () => {
    const { alice, doc } = await setup();
    gemini
      .mockResolvedValueOnce(cardsJson([...SENTENCES.slice(0, 9), INVENTED]))
      .mockResolvedValueOnce(cardsJson([SENTENCES[9]]));

    expect(await generateCards(alice.id, doc.id, 10, () => {})).toEqual({ count: 10, requested: 10 });
    expect(gemini).toHaveBeenCalledTimes(2);
    expect(requestedAt(0)).toBe(10);
    expect(requestedAt(1)).toBe(1);
    const retryPrompt = gemini.mock.calls[1][0];
    expect(retryPrompt).toContain(`extrait introuvable dans le document (pas copié mot pour mot) : « ${INVENTED} »`);
    expect(retryPrompt).toContain("- Question 0 ?");
    expect((await getCards(alice.id, doc.id)).map((c) => c.excerpt)).toEqual(SENTENCES);
  });

  test("enregistre les cartes valides si certaines manquent encore après 2 relances", async () => {
    const { alice, doc } = await setup();
    gemini
      .mockResolvedValueOnce(cardsJson([...SENTENCES.slice(0, 9), INVENTED]))
      .mockResolvedValue(cardsJson([INVENTED]));

    expect(await generateCards(alice.id, doc.id, 10, () => {})).toEqual({ count: 9, requested: 10 });
    expect(gemini).toHaveBeenCalledTimes(3);
    expect(await getCards(alice.id, doc.id)).toHaveLength(9);
  });

  test("sans aucune carte valide : erreur et cartes existantes inchangées", async () => {
    const { alice, doc } = await setup();
    await replaceCards(alice.id, doc.id, [{ question: "Ancienne", answer: "R", excerpt: SENTENCES[0] }]);
    gemini.mockResolvedValueOnce("pas du json").mockResolvedValue(cardsJson([INVENTED]));

    const result = await generateCards(alice.id, doc.id, 5, () => {});
    expect(result).toEqual({ error: expect.stringContaining("aucune carte fidèle") });
    expect(gemini).toHaveBeenCalledTimes(3);
    expect((await getCards(alice.id, doc.id)).map((c) => c.question)).toEqual(["Ancienne"]);
  });

  test("n'enregistre jamais plus de cartes que demandé", async () => {
    const { alice, doc } = await setup();
    gemini.mockResolvedValueOnce(cardsJson(SENTENCES));

    expect(await generateCards(alice.id, doc.id, 5, () => {})).toEqual({ count: 5, requested: 5 });
    expect(await getCards(alice.id, doc.id)).toHaveLength(5);
  });

  test("n'envoie à Gemini que le début d'un texte trop long", async () => {
    const marker = "PASSAGE APRES LA LIMITE";
    const { alice, doc } = await setup(TEXT + "x".repeat(MAX_TEXT_CHARS) + marker);
    gemini.mockResolvedValue(cardsJson([marker + " de trente mille caracteres"]));

    expect(await generateCards(alice.id, doc.id, 5, () => {})).toHaveProperty("error");
    expect(gemini.mock.calls[0][0]).not.toContain(marker);
  });
});

describe("isolation des cartes", () => {
  test("un utilisateur ne peut ni générer, ni lire, ni remplacer les cartes d'un autre", async () => {
    const { alice, bob, doc } = await setup();
    gemini.mockResolvedValue(cardsJson(SENTENCES));
    await generateCards(alice.id, doc.id, 10, () => {});
    gemini.mockClear();

    expect(await generateCards(bob.id, doc.id, 10, () => {})).toEqual({ error: "Document introuvable." });
    expect(gemini).not.toHaveBeenCalled();
    expect(await getCards(bob.id, doc.id)).toHaveLength(0);
    await expect(replaceCards(bob.id, doc.id, [])).rejects.toThrow();
    expect(await getCards(alice.id, doc.id)).toHaveLength(10);
  });
});
