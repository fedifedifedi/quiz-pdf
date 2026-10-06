import { prisma } from "@/lib/db";

// Toutes les requêtes sur les documents passent par ici et sont filtrées par userId.

export function listDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    select: { id: true, name: true, createdAt: true, _count: { select: { cards: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// findFirst sur (id, userId) : le document d'un autre utilisateur est introuvable (→ 404).
export function getDocument(userId: string, id: string) {
  return prisma.document.findFirst({
    where: { id, userId },
    select: { id: true, name: true, text: true, createdAt: true },
  });
}

export function createDocument(
  userId: string,
  data: { name: string; file: Uint8Array<ArrayBuffer>; text: string },
) {
  return prisma.document.create({ data: { ...data, userId }, select: { id: true } });
}

export function getCards(userId: string, documentId: string) {
  return prisma.card.findMany({
    where: { documentId, document: { userId } },
    select: { id: true, question: true, answer: true, excerpt: true },
    orderBy: { position: "asc" },
  });
}

// Remplace toutes les cartes du document en une seule écriture atomique.
// Le filtre userId fait échouer l'écriture si le document n'appartient pas à l'utilisateur.
export function replaceCards(
  userId: string,
  documentId: string,
  cards: { question: string; answer: string; excerpt: string }[],
) {
  return prisma.document.update({
    where: { id: documentId, userId },
    data: {
      cards: {
        deleteMany: {},
        create: cards.map((card, position) => ({ ...card, position })),
      },
    },
    select: { id: true },
  });
}
