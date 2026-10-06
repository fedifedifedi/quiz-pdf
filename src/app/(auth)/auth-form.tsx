"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Logo } from "../logo";
import { type AuthState, login, register } from "./actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : register,
    undefined,
  );
  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo />
      <div className="panel mt-8 w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">{isLogin ? "Connexion" : "Créer un compte"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin
            ? "Retrouvez vos documents et vos cartes de révision."
            : "Transformez vos cours PDF en cartes de révision."}
        </p>
        <form action={action} className="mt-6 space-y-4">
          <label className="label">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state?.email}
              className="input"
            />
          </label>
          <label className="label">
            Mot de passe
            <input
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? undefined : 8}
              aria-describedby={isLogin ? undefined : "password-hint"}
              className="input"
            />
            {!isLogin && (
              <span id="password-hint" className="mt-1.5 block text-xs font-normal text-slate-500">
                8 caractères minimum.
              </span>
            )}
          </label>
          {state?.error && (
            <p role="alert" className="alert alert-error">
              {state.error}
            </p>
          )}
          <button disabled={pending} className="btn btn-primary w-full">
            {pending && <span className="spinner" aria-hidden />}
            {isLogin ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          {isLogin ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>
    </main>
  );
}
