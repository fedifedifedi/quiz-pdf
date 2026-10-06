# SPEC — Cartes de révision à partir d'un PDF

Application web locale : un utilisateur connecté dépose un PDF, choisit un nombre de cartes,
Gemini génère des cartes question/réponse **tirées du PDF**, puis l'utilisateur les révise et
obtient un score enregistré dans son historique.

## Périmètre

- Stack imposée : Next.js (App Router) + Prisma + SQLite + Tailwind. Lancement en une commande.
- Tout tourne en local, sauf l'appel à l'API Gemini (côté serveur uniquement).
- Hors périmètre : OCR, partage entre utilisateurs, réinitialisation de mot de passe, édition des cartes.

## Parcours et critères d'acceptation

### 1. Compte et session
- Inscription par email + mot de passe (≥ 8 caractères). Email unique, message clair si déjà pris.
- Mot de passe stocké haché avec bcrypt, jamais en clair.
- Connexion : session stockée en base, jeton aléatoire dans un cookie `httpOnly`, `sameSite=lax`,
  `secure` en production, expiration 7 jours.
- Identifiants incorrects → message générique (« Email ou mot de passe incorrect »).
- Déconnexion : session supprimée en base et cookie effacé.
- Toute page applicative et toute route/action serveur exige une session valide ;
  un non-connecté est redirigé vers `/login` (pages) ou reçoit 401 (API).

### 2. Dépôt du PDF
- Fichier refusé avec message clair si : absent, pas un PDF (extension/type **et** signature `%PDF-`),
  > 10 Mo, illisible/corrompu.
- Le texte est extrait côté serveur.
- PDF sans texte exploitable (scanné : moins de 200 caractères utiles) → message
  « Ce PDF ne contient pas de texte sélectionnable (PDF scanné ?) », rien n'est enregistré
  et **aucun appel à Gemini**.
- Si le PDF est valide : document enregistré **dès l'upload** (nom, fichier PDF en `Bytes`, texte extrait),
  rattaché à l'utilisateur, puis redirection vers la page du document.
- Liste « Mes documents » de l'utilisateur.

### 3. Nombre de cartes
- Sur la page du document : entier entre 5 et 30 (valeur par défaut 10), validé côté client **et** serveur.
- La génération peut être relancée depuis la page du document sans renvoyer le PDF
  (les nouvelles cartes remplacent les précédentes).

### 4. Génération
- Le texte envoyé à Gemini est tronqué à 30 000 caractères (limite de coût). Si c'est le cas,
  la page du document le signale (« seuls les 30 000 premiers caractères sur N seront utilisés »).
- Modèle lu depuis `GEMINI_MODEL`, clé depuis `GEMINI_API_KEY` (serveur uniquement).
- Réponse demandée en JSON structuré (schéma imposé) : `{ cards: [{ question, answer, excerpt }] }`.
- Le serveur vérifie **chaque carte** :
  - chaque champ est une chaîne non vide ;
  - chaque `excerpt` (≥ 20 caractères) **existe dans le texte envoyé**, après normalisation
    (casse, espaces, césures, guillemets/tirets typographiques) ;
  - l'`excerpt` n'est pas un titre ou sous-titre (ligne isolée sans ponctuation finale) ;
  - l'`excerpt` (normalisé) n'est pas identique à celui d'une carte déjà retenue (doublon).
- Les cartes valides sont gardées ; seules les cartes manquantes sont redemandées à Gemini,
  avec la raison des refus, **au plus 2 relances**. Jamais plus de cartes que demandé.
- Chaque refus est journalisé côté serveur avec l'extrait (tronqué à 100 caractères).
- Les cartes valides remplacent celles du document dans une seule transaction. S'il en manque
  encore après les relances, l'interface affiche « X cartes générées sur Y demandées ».
  Si aucune carte n'est valide : message d'erreur, cartes existantes inchangées.
- Indicateur de progression visible avec 3 étapes réelles : **Extraction → Génération → Vérification**,
  l'étape en cours et les étapes terminées sont visibles ; une erreur s'affiche sur l'étape concernée.
  (L'étape « Extraction » lit le texte extrait à l'upload et le tronque ; l'upload affiche lui aussi
  un état « Extraction du texte… » pendant le traitement du PDF.)

### 5. Révision
- Une carte à la fois, recto (question) visible ; bouton « Retourner » affiche le verso (réponse + extrait source).
- Boutons « Bon » / « Faux » disponibles une fois la carte retournée, puis carte suivante.
- Indication de progression (carte n / total).

### 6. Score et historique
- En fin de séance : score en pourcentage (arrondi) affiché et enregistré (bonnes réponses, total, %).
- Le serveur recalcule le total à partir des cartes du document de l'utilisateur et rejette un score incohérent.
- Page historique : séances de l'utilisateur, plus récentes d'abord (date, document, score).

## Sécurité et isolation
- Chaque requête Prisma sur documents, cartes et séances est filtrée par l'`userId` de la session.
- Accès à la ressource d'un autre utilisateur → 404 (on ne révèle pas son existence).
- `.env` ignoré par git ; `.env.example` contient les noms de variables **sans valeur**.
- La clé Gemini n'apparaît jamais dans le code client, les logs ou les réponses.

## Gemini et tests
- L'application appelle **toujours** le vrai Gemini.
- Un faux provider n'existe que dans les tests automatiques (mock du module Gemini dans Vitest).

## Tests (ciblés)
- Validation des cartes : nombre exact, extrait absent, extrait trop court, normalisation, JSON invalide.
- Validation PDF : non-PDF, trop lourd, PDF sans texte → pas d'appel Gemini.
- Isolation : l'utilisateur B ne peut ni lister, ni lire, ni réviser, ni scorer les données de A.
- Auth : mot de passe haché, session invalide/expirée refusée.

## CI
- GitHub Actions sur chaque PR : lint, typecheck, tests.

## Livrables
- Repo GitHub public, `README.md` court (installation, lancement, connexion), `PROMPTS.md`.
