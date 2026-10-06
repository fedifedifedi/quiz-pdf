import { prisma } from "@/lib/db";
import { getCards } from "@/lib/documents";

// Le score est recalculé ici : le client n'envoie que les identifiants des cartes jugées « Bon ».
// Un identifiant inconnu, répété ou d'un autre document est ignoré ; le total vient de la base.
export async function saveReview(userId: string, documentId: string, correctCardIds: string[]) {
  const cards = await getCards(userId, documentId);
  if (cards.length === 0) return null; // document absent, d'un autre utilisateur ou sans cartes

  const correct = cards.filter((card) => correctCardIds.includes(card.id)).length;
  const total = cards.length;
  const score = Math.round((correct / total) * 100);
  await prisma.reviewSession.create({ data: { userId, documentId, correct, total, score } });
  return { correct, total, score };
}

export function listReviews(userId: string) {
  return prisma.reviewSession.findMany({
    where: { userId },
    select: {
      id: true,
      correct: true,
      total: true,
      score: true,
      createdAt: true,
      document: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
