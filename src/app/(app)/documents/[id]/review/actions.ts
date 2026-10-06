"use server";

import { requireUser } from "@/lib/auth";
import { saveReview } from "@/lib/reviews";

export async function finishReview(documentId: string, correctCardIds: string[]) {
  const user = await requireUser();
  // Arguments venant du navigateur : on vérifie leur type avant de les utiliser.
  if (typeof documentId !== "string" || !Array.isArray(correctCardIds)) return null;
  return saveReview(
    user.id,
    documentId,
    correctCardIds.filter((id) => typeof id === "string"),
  );
}
