# PROMPTS.md

Consignes données à l'agent (Claude Code) pendant le test, et ce que j'ai corrigé moi-même.

## Consignes données à l'agent

1. **Cadrage.** Énoncé complet du test (parcours, contraintes, livrables). Vérifier l'environnement et
   configurer git, rédiger `SPEC.md` (critères d'acceptation) et `CLAUDE.md` (stack, structure,
   commandes, règles : une branche et une PR par fonctionnalité, relecture avant merge, aucun secret),
   proposer l'architecture et un découpage en PR courtes, commencer par ce qui ne dépend pas de la clé
   Gemini, **attendre ma validation avant d'implémenter**.
2. **Validation de l'architecture**, avec mes décisions : document enregistré dès l'upload, seuil
   « PDF scanné » à 200 caractères, limite de 30 000 caractères envoyés à Gemini signalée à
   l'utilisateur, extraction avec `unpdf`. Ajouts : stocker aussi le PDF en base (`Bytes`), CI GitHub
   Actions minimale (lint, typecheck, tests). Puis commit initial et PR 1 à 4.
3. **Relecture et merge des PR 1 à 4** : relecture exigeante (sécurité, isolation par `userId`, code
   mort, complexité) publiée en commentaire, correction des bloquants, merge avec CI verte.
   Corriger `validateCards` d'après le texte réel extrait de mon PDF. PR Gemini : clé jamais affichée,
   copiée ni journalisée ; script qui vérifie la clé et liste les modèles en **un seul appel** ; je
   choisis moi-même `GEMINI_MODEL` ; faux provider uniquement dans les tests (budget 5 à 10 €).
4. **Après mon 1er test réel de génération** : corriger la double numérotation, la qualité
   pédagogique (prompt) et la lisibilité de la progression, sans ralentir. Puis merge de la PR #5.
5. **Après mon 2e test réel** : la double numérotation persiste, vérifier l'affichage et corriger à la
   source (retirer le nettoyage serveur devenu inutile) ; refuser les sous-titres cités comme extraits.
6. **Après mon 3e test réel** : sortir du tout-ou-rien (garder les cartes valides, ne redemander que les
   manquantes avec la raison du refus, 2 relances max, enregistrer un résultat partiel « X cartes sur
   Y »), journaliser les extraits refusés, vérifier les faux positifs de la règle « titre », ajouter un
   test.
7. **Après mon test à 30 cartes** : refuser les doublons (même extrait), une notion par carte, test ;
   merge de la PR #6 ; PR suivante : séance de révision, score recalculé côté serveur, historique.
8. **Fin** : merge de la PR #7, PR `docs/readme` (README court, PROMPTS.md finalisé), vérifier
   qu'il ne reste ni code mort ni fichier inutile, et qu'aucun secret n'est dans l'historique git.

## Mes tests manuels (Chrome, `npm run dev`, console F12)

- **PR 1 à 4** : inscription, connexion, déconnexion ; console sans erreur ; upload de
  `cours-relativite.pdf` (27 061 caractères extraits) ; faux PDF (`.txt` renommé) refusé avec un
  message clair ; document sans session → `/login` ; mauvais mot de passe → message clair ; second
  utilisateur sur l'URL du document du premier → 404, et liste vide.
- **Génération, 1er test** (`gemini-3.5-flash-lite`, 10 cartes) : 10 cartes en 4 s, toutes fidèles,
  mais double numérotation, cartes concentrées au début du document et anecdotiques, progression trop
  rapide pour être lue.
- **2e test** : nette amélioration (cartes réparties, notions clés, réponses complètes), mais la double
  numérotation persiste sur des cartes regénérées, et 2 cartes citent un sous-titre comme extrait.
- **3e test** : la génération de 10 cartes échoue souvent après 2 tentatives, alors qu'une seule carte
  sur 10 est refusée à chaque fois.
- **4e test** : 10 cartes OK ; 30 cartes OK et toutes justes, mais 3 paires de doublons.
- **Révision (PR 7)** : séance de 10 cartes (7 Bon, 3 Faux) → 70 % ; historique OK, le plus récent en
  premier ; un second utilisateur ne voit aucune séance du premier ; console sans erreur.

## Relecture des PR (commentaires publiés sur chaque PR)

- Aucun bloquant de sécurité ni d'isolation : toutes les requêtes sur documents, cartes et séances sont
  filtrées par `userId`, une ressource d'un autre utilisateur donne une 404 sans révéler son existence,
  `requireUser()` est appelé dans chaque page, action et route.
- Clé Gemini : `server-only`, absente du bundle client (vérifié), jamais journalisée. Historique git
  vérifié : ni la clé, ni `.env`, ni base SQLite, ni PDF n'ont jamais été commités.
- Non bloquants, acceptés et documentés : limite de 72 octets de bcrypt ; possibilité de savoir si un
  email a un compte (inhérent à l'inscription) ; pas de limite de tentatives de connexion (app locale) ;
  `pdf.destroy()` absent ; limite de 10 Mo dupliquée côté client (évite d'embarquer `unpdf` dans le
  navigateur) ; génération non annulée si l'on quitte la page.
- Incident de merge : supprimer la branche de la PR 1 après son merge a fermé la PR 2 empilée dessus.
  L'agent a recréé la branche, rouvert la PR et l'a rebasée sur `main` ; ensuite, il a toujours rebasé
  la PR suivante sur `main` avant de merger.
- Nettoyage final : constantes 5 et 30 dupliquées en dur dans le formulaire et la route (remplacées par
  `MIN_CARDS` et `MAX_CARDS`), exports inutiles retirés.

## Ce que j'ai corrigé moi-même

1. **Retour au texte de l'énoncé pour l'étape 2.** L'agent proposait d'enregistrer le document
   seulement après une génération réussie, en une seule transaction avec les cartes. L'énoncé dit
   « Texte extrait, document enregistré » dès le dépôt : j'ai imposé l'enregistrement à l'upload et la
   génération depuis la page du document, ce qui permet aussi de relancer sans renvoyer le PDF. J'ai
   aussi demandé de stocker le fichier PDF en base et d'ajouter une CI dès la PR 1.
2. **Troncature visible.** Si le texte dépasse 30 000 caractères, l'interface doit le dire.
3. **Cas réels de `validateCards`.** En lisant le texte réellement extrait de mon PDF, j'ai repéré des
   titres aux lettres espacées (`L ' E X P É R I E N C E D E M I C H E L S O N`) et des mots coupés en
   fin de ligne (`années-⏎lumière`, `rez-de-⏎chaussée`). Correction : la comparaison se fait sans
   espaces, tirets ni guillemets, avec des tests sur ces extraits réels ; le prompt demande des extraits
   du corps du texte.
4. **Double numérotation mal diagnostiquée.** Après mon 1er test (« 1. 1. Quelle était… »), l'agent a
   attribué le défaut au modèle et ajouté une consigne « sans numéro » et un nettoyage côté serveur.
   **Mon 2e test a montré que le défaut persistait sur des cartes regénérées** : la cause n'était pas le
   modèle. Vraie cause, confirmée en base (aucune question stockée ne commence par un numéro) : la page
   numérotait deux fois, via la liste `<ol>` et via un `{i + 1}.` écrit à la main. Correction à la source
   (une seule numérotation), et suppression du nettoyage serveur, de la consigne et de leur test.
5. **Sous-titres cités comme extraits** (« La simultanéité est relative ») : l'extrait doit être la phrase
   du corps du texte qui contient la réponse. Le serveur refuse un extrait identique à une ligne sans
   ponctuation finale. Rejouée sur mes 10 cartes, la règle refuse exactement les 2 cartes fautives ; sur
   les 262 phrases réelles du PDF, aucun faux positif.
6. **Qualité pédagogique.** Les cartes venaient surtout du début du document et portaient sur des
   anecdotes. Le prompt, gardé court et générique, demande des cartes réparties sur tout le document,
   centrées sur les notions clés, avec des réponses complètes (le résultat d'une expérience, pas
   seulement sa méthode).
7. **Progression lisible sans ralentir** : les étapes restent affichées et cochées à la fin, plutôt
   que d'ajouter des délais artificiels.
8. **Fin du tout-ou-rien.** Mon 3e test a révélé qu'une seule carte refusée sur 10 faisait jeter les 9
   autres, d'où des échecs fréquents (pire à 30 cartes). Désormais, les cartes valides sont gardées,
   seules les manquantes sont redemandées avec la raison du refus (2 relances max), un résultat partiel
   est enregistré et affiché (« X cartes générées sur Y demandées »), et chaque refus est journalisé
   avec son extrait. Vérification associée : aucune phrase recopiée du PDF n'est jugée « introuvable »,
   donc la normalisation est hors de cause ; les refus viennent de reformulations de Gemini.
9. **Doublons à 30 cartes.** Mon test à 30 cartes a révélé 3 paires de cartes citant exactement le même
   extrait. Correction simple, sans algorithme de similarité : un extrait normalisé identique à celui
   d'une carte retenue est refusé comme doublon et redemandé ; le prompt demande une notion par carte.
