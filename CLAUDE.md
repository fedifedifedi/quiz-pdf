# CLAUDE.md

Générateur de cartes de révision à partir d'un PDF (voir `SPEC.md` pour le besoin et les critères d'acceptation).

## Stack
- Next.js (App Router, TypeScript) + Tailwind CSS
- Prisma + SQLite
- bcrypt (mots de passe), session en base + cookie `httpOnly`
- `@google/genai` (Gemini, serveur uniquement), `unpdf` (extraction de texte)
- Vitest (tests)

## Structure
```
prisma/schema.prisma        modèles User, Session, Document, Card, ReviewSession
src/app/(auth)/             login, register
src/app/(app)/              pages protégées (layout appelle requireUser)
src/app/api/generate/       route POST : génération → vérification pour un document (flux NDJSON)
src/lib/db.ts               client Prisma
src/lib/auth.ts             hash, sessions, requireUser
src/lib/pdf.ts              validation du fichier + extraction du texte
src/lib/gemini.ts           appel Gemini (server-only)
src/lib/cards.ts            prompt, schéma JSON, validation des cartes
tests/                      tests Vitest
```

## Commandes
- `npm install` — dépendances (+ `prisma generate`)
- `npm run dev` — applique les migrations puis lance l'app sur http://localhost:3000
- `npm test` — tests
- `npm run lint` — lint
- `npm run typecheck` — vérification TypeScript
- CI (`.github/workflows/ci.yml`) : lint, typecheck, tests sur chaque PR

## Règles
- Une branche et une PR par fonctionnalité (`feat/…`, `fix/…`, `chore/…`) ; jamais de commit direct sur `main`.
- Relecture du diff avant chaque merge (relecture humaine, puis `/code-review`).
- Aucun secret dans le code ni dans git : clé uniquement dans `.env` ; `.env.example` sans valeurs.
- Toute requête sur Document, Card, ReviewSession filtre par `userId` de la session.
- L'app appelle toujours le vrai Gemini ; faux provider uniquement via `vi.mock` dans les tests.
- Modèle Gemini lu depuis `GEMINI_MODEL`, jamais en dur.
- Code simple : pas d'abstraction sans second usage, pas de code mort, pas de dépendance superflue.
- Messages d'erreur utilisateur en français, clairs et actionnables.
