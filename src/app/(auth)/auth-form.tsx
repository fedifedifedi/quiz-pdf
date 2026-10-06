"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type AuthState, login, register } from "./actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : register,
    undefined,
  );
  const isLogin = mode === "login";

  return (
    <main className="mx-auto mt-24 max-w-sm rounded-lg bg-white p-8 shadow">
      <h1 className="text-xl font-semibold">{isLogin ? "Connexion" : "Créer un compte"}</h1>
      <form action={action} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={state?.email}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700">Mot de passe</span>
          <input
            name="password"
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLogin ? "Se connecter" : "Créer le compte"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <Link href={isLogin ? "/register" : "/login"} className="text-indigo-600 hover:underline">
          {isLogin ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>
    </main>
  );
}
