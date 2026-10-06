import { describe, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { createDocument, getCards, replaceCards } from "@/lib/documents";
import { listReviews, saveReview } from "@/lib/reviews";
import { createUser, makePdf } from "./helpers";

let n = 0;
async function setup() {
  n++;
  const alice = await createUser(`alice-rev${n}@test.fr`);
  const bob = await createUser(`bob-rev${n}@test.fr`);
  const doc = await createDocument(alice.id, { name: "cours.pdf", file: makePdf(), text: "texte" });
  const card = (i: number) => ({ question: `Q${i} ?`, answer: "R", excerpt: `Extrait numéro ${i} du cours.` });
  await replaceCards(alice.id, doc.id, [card(1), card(2), card(3)]);
  const ids = (await getCards(alice.id, doc.id)).map((c) => c.id);
  return { alice, bob, doc, ids };
}

describe("saveReview", () => {
  test("recalcule le score à partir des cartes en base et l'enregistre", async () => {
    const { alice, doc, ids } = await setup();

    expect(await saveReview(alice.id, doc.id, [ids[0], ids[2]])).toEqual({ correct: 2, total: 3, score: 67 });
    expect(await prisma.reviewSession.findFirst({ where: { userId: alice.id } })).toMatchObject({
      documentId: doc.id,
      correct: 2,
      total: 3,
      score: 67,
    });
  });

  test("ignore les identifiants inconnus, répétés ou d'un autre document", async () => {
    const { alice, doc, ids } = await setup();
    const other = await setup();

    const result = await saveReview(alice.id, doc.id, [ids[0], ids[0], "inconnu", other.ids[1]]);
    expect(result).toEqual({ correct: 1, total: 3, score: 33 });
  });

  test("0 % et 100 %", async () => {
    const { alice, doc, ids } = await setup();
    expect(await saveReview(alice.id, doc.id, [])).toMatchObject({ score: 0 });
    expect(await saveReview(alice.id, doc.id, ids)).toMatchObject({ score: 100 });
  });
});

describe("isolation des séances", () => {
  test("un utilisateur ne peut pas enregistrer de score sur le document d'un autre", async () => {
    const { bob, doc, ids } = await setup();

    expect(await saveReview(bob.id, doc.id, ids)).toBeNull();
    expect(await prisma.reviewSession.count({ where: { documentId: doc.id } })).toBe(0);
  });

  test("l'historique ne contient que les séances de l'utilisateur, les plus récentes d'abord", async () => {
    const { alice, bob, doc, ids } = await setup();
    await saveReview(alice.id, doc.id, [ids[0]]);
    // Date fixée pour un ordre déterministe (deux séances peuvent tomber dans la même milliseconde).
    await prisma.reviewSession.updateMany({ where: { userId: alice.id }, data: { createdAt: new Date(2026, 0, 1) } });
    await saveReview(alice.id, doc.id, ids);

    const history = await listReviews(alice.id);
    expect(history.map((r) => r.score)).toEqual([100, 33]);
    expect(history[0].document).toEqual({ id: doc.id, name: "cours.pdf" });
    expect(await listReviews(bob.id)).toEqual([]);
  });
});
