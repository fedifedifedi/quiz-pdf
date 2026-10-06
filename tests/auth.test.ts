import { describe, expect, test } from "vitest";
import {
  createSessionToken,
  findUserBySessionToken,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createUser } from "./helpers";

describe("mots de passe", () => {
  test("sont hachés avec bcrypt et vérifiables", async () => {
    const hash = await hashPassword("motdepasse");
    expect(hash).not.toContain("motdepasse");
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(await verifyPassword("motdepasse", hash)).toBe(true);
    expect(await verifyPassword("mauvais", hash)).toBe(false);
  });
});

describe("sessions", () => {
  test("un jeton valide retrouve son utilisateur, et seul son hash est stocké", async () => {
    const user = await createUser("session-ok@test.fr");
    const { token } = await createSessionToken(user.id);

    expect(await findUserBySessionToken(token)).toEqual({ id: user.id, email: user.email });
    expect(await prisma.session.findUnique({ where: { id: token } })).toBeNull();
  });

  test("un jeton inconnu est refusé", async () => {
    expect(await findUserBySessionToken("jeton-inexistant")).toBeNull();
  });

  test("une session expirée est refusée et supprimée", async () => {
    const user = await createUser("session-expiree@test.fr");
    const { token } = await createSessionToken(user.id);
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await findUserBySessionToken(token)).toBeNull();
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });
});
