import { describe, expect, test } from "vitest";
import { createDocument, getDocument, listDocuments } from "@/lib/documents";
import { createUser, makePdf } from "./helpers";

describe("isolation des documents", () => {
  test("un utilisateur ne voit ni ne lit les documents d'un autre", async () => {
    const alice = await createUser("alice-docs@test.fr");
    const bob = await createUser("bob-docs@test.fr");
    const doc = await createDocument(alice.id, { name: "a.pdf", file: makePdf(), text: "texte" });

    expect(await listDocuments(alice.id)).toHaveLength(1);
    expect(await getDocument(alice.id, doc.id)).not.toBeNull();

    expect(await listDocuments(bob.id)).toHaveLength(0);
    expect(await getDocument(bob.id, doc.id)).toBeNull();
  });
});
