"use server";

import { redirect } from "next/navigation";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AuthState = { error: string; email: string } | undefined;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse email invalide.", email };
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères.", email };
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Un compte existe déjà avec cet email.", email };
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  await startSession(user.id);
  redirect("/");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email ou mot de passe incorrect.", email };
  }
  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
