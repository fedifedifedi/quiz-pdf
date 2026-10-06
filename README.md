# Quiz PDF

Génère des cartes de révision (question / réponse) à partir d'un PDF avec Gemini, puis permet de les
réviser et de suivre ses scores. Tout tourne en local, sauf l'appel à l'API Gemini.

Stack : Next.js, Prisma, SQLite, Tailwind.

## Installation

Prérequis : Node.js 24 et une clé API Gemini ([Google AI Studio](https://aistudio.google.com/apikey)).

```bash
npm install
cp .env.example .env        # Windows (PowerShell) : Copy-Item .env.example .env
```

Puis renseigner dans `.env` :

| Variable         | Rôle                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Clé de l'API Gemini. Lue uniquement côté serveur, jamais envoyée au navigateur. |
| `GEMINI_MODEL`   | Nom du modèle Gemini utilisé pour générer les cartes (ex. un modèle « Flash-Lite », rapide et économique). |

La clé ne doit figurer que dans `.env`, qui est ignoré par git.

## Lancement

```bash
npm run dev
```

Cette seule commande crée ou met à jour la base SQLite locale (`dev.db`, migrations Prisma), puis
lance l'application sur http://localhost:3000.

## Connexion

Aucun compte n'est fourni : sur http://localhost:3000, cliquer sur **Créer un compte**
(email + mot de passe de 8 caractères minimum). Ensuite, se connecter depuis `/login`.
Chaque utilisateur ne voit que ses propres documents, cartes et scores.

## Utilisation

1. Déposer un PDF texte (10 Mo maximum ; un PDF scanné sans texte est refusé).
2. Sur la page du document, choisir le nombre de cartes (5 à 30) et lancer la génération.
3. Cliquer sur **Réviser ces cartes** : retourner chaque carte, répondre Bon ou Faux.
4. Le score final est enregistré et consultable dans **Historique**.

## Tests

```bash
npm test             # tests Vitest (Gemini est simulé uniquement ici)
npm run lint
npm run typecheck
```

La CI GitHub Actions lance ces trois commandes sur chaque PR.

## Documents du projet

- [SPEC.md](SPEC.md) : besoin et critères d'acceptation.
- [CLAUDE.md](CLAUDE.md) : structure du code et règles de travail.
- [PROMPTS.md](PROMPTS.md) : consignes données à l'agent et corrections faites à la main.
