import { beforeEach, describe, expect, test, vi } from "vitest";
import { MAX_TEXT_CHARS } from "@/lib/cards";
import { createDocument, getCards, replaceCards } from "@/lib/documents";
import { callGemini } from "@/lib/gemini";
import { generateCards, type Step } from "@/lib/generation";
import { createUser, makePdf } from "./helpers";

// Faux provider : uniquement dans les tests, l'application appelle toujours le vrai Gemini.
vi.mock("@/lib/gemini", () => ({ callGemini: vi.fn() }));
const gemini = vi.mocked(callGemini);

const TEXT = [
  "La vitesse de la lumière dans le vide est la même pour tous les observateurs.",
  "Un objet qui a une masse ne peut jamais atteindre la vitesse de la lumière.",
  "Le temps s'écoule plus lentement pour une horloge en mouvement rapide.",
  "Les muons créés en haute atmosphère atteignent le sol grâce à la dilatation du temps.",
  "La masse est une forme d'énergie, comme le résume la formule E = mc².",
].join("\n");

const cardsJson = (excerpts: string[]) =>
  JSON.stringify({ cards: excerpts.map((excerpt) => ({ question: "Q ?", answer: "R", excerpt })) });
const VALID = cardsJson(TEXT.split("\n"));
const INVENTED = cardsJson([...TEXT.split("\n").slice(0, 4), "La lumière ralentit dans le vide spatial."]);

let n = 0;
async function setup(text = TEXT) {
  n++;
  const alice = await createUser(`alice-gen${n}@test.fr`);
  const bob = await createUser(`bob-gen${n}@test.fr`);
  const doc = await createDocument(alice.id, { name: "cours.pdf", file: makePdf(), text });
  return { alice, bob, doc };
}

beforeEach(() => gemini.mockReset());

describe("generateCards", () => {
  test("génère, vérifie et enregistre les cartes en signalant chaque étape", async () => {
    const { alice, doc } = await setup();
    gemini.mockResolvedValueOnce(VALID);
    const steps: Step[] = [];

    expect(await generateCards(alice.id, doc.id, 5, (s) => steps.push(s))).toEqual({ count: 5 });
    expect(steps).toEqual(["extraction", "generation", "verification"]);
    const cards = await getCards(alice.id, doc.id);
    expect(cards.map((c) => c.excerpt)).toEqual(TEXT.split("\n"));
  });

  test("réessaie une fois si une carte est inventée", async () => {
    const { alice, doc } = await setup();
    gemini.mockResolvedValueOnce(INVENTED).mockResolvedValueOnce(VALID);

    expect(await generateCards(alice.id, doc.id, 5, () => {})).toEqual({ count: 5 });
    expect(gemini).toHaveBeenCalledTimes(2);
  });

  test("abandonne après 2 échecs sans toucher aux cartes existantes", async () => {
    const { alice, doc } = await setup();
    await replaceCards(alice.id, doc.id, [{ question: "Ancienne", answer: "R", excerpt: TEXT.split("\n")[0] }]);
    gemini.mockResolvedValue(INVENTED);

    const result = await generateCards(alice.id, doc.id, 5, () => {});
    expect(result).toEqual({ error: expect.stringContaining("pas produit de cartes fidèles") });
    expect(gemini).toHaveBeenCalledTimes(2);
    expect((await getCards(alice.id, doc.id)).map((c) => c.question)).toEqual(["Ancienne"]);
  });

  test("refuse un nombre de cartes différent de celui demandé", async () => {
    const { alice, doc } = await setup();
    gemini.mockResolvedValue(VALID);

    expect(await generateCards(alice.id, doc.id, 6, () => {})).toHaveProperty("error");
    expect(await getCards(alice.id, doc.id)).toHaveLength(0);
  });

  test("n'envoie à Gemini que le début d'un texte trop long", async () => {
    const marker = "PASSAGE APRES LA LIMITE";
    const { alice, doc } = await setup(TEXT + "x".repeat(MAX_TEXT_CHARS) + marker);
    gemini.mockResolvedValue(cardsJson([marker + " de trente mille caracteres"]));

    expect(await generateCards(alice.id, doc.id, 1, () => {})).toHaveProperty("error");
    expect(gemini.mock.calls[0][0]).not.toContain(marker);
  });
});

describe("isolation des cartes", () => {
  test("un utilisateur ne peut ni générer, ni lire, ni remplacer les cartes d'un autre", async () => {
    const { alice, bob, doc } = await setup();
    gemini.mockResolvedValue(VALID);
    await generateCards(alice.id, doc.id, 5, () => {});
    gemini.mockClear();

    expect(await generateCards(bob.id, doc.id, 5, () => {})).toEqual({ error: "Document introuvable." });
    expect(gemini).not.toHaveBeenCalled();
    expect(await getCards(bob.id, doc.id)).toHaveLength(0);
    await expect(replaceCards(bob.id, doc.id, [])).rejects.toThrow();
    expect(await getCards(alice.id, doc.id)).toHaveLength(5);
  });
});
