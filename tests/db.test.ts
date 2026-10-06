import { expect, test } from "vitest";
import { prisma } from "@/lib/db";

test("la base de test est migrée et accessible", async () => {
  expect(await prisma.user.count()).toBe(0);
});
