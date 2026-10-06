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
