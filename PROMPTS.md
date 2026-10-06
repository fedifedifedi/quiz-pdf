# PROMPTS.md

## Consignes données à l'agent

1. Énoncé complet du test (projet, contraintes, livrables) + demande de vérifier l'environnement,
   rédiger `SPEC.md` et `CLAUDE.md`, proposer architecture et découpage en PR, et attendre validation
   avant d'implémenter.
2. Validation de l'architecture et du découpage, avec mes décisions :
   - le document est enregistré dès l'upload, la génération se lance depuis la page du document
     (relance possible sans renvoyer le PDF) — l'agent proposait un enregistrement unique après génération ;
   - seuil PDF scanné : 200 caractères ;
   - limite de 30 000 caractères envoyés à Gemini, **signalée à l'utilisateur** si le texte est tronqué ;
   - extraction avec `unpdf`.
   Ajouts : stocker aussi le fichier PDF en base (`Bytes`, avec la limite de taille) ;
   CI GitHub Actions minimale (lint, typecheck, tests) dès la PR 1.
   Puis : commit initial et enchaînement des PR 1 à 4.
3. Relecture exigeante de chaque PR (sécurité, isolation par `userId`, code mort, complexité),
   publiée en commentaire, correction des bloquants, merge une fois la CI verte.
   Corrections de `validateCards` d'après le texte réel extrait de mon PDF de test.
   Génération Gemini (PR #6) : clé jamais affichée ni copiée ; script qui vérifie la clé et liste les
   modèles en un seul appel ; je choisis moi-même `GEMINI_MODEL` ; mock uniquement dans les tests
   (budget 5 à 10 €).
4. Après mon test réel de génération : corrections de la PR #6 avant merge (voir ci-dessous), puis
   merge de la PR #5. Je reteste avant le merge de la PR #6.

## Mes tests manuels (navigateur Chrome, `npm run dev`, console F12)

Après les PR 1 à 4, tout est OK :
- inscription, connexion, déconnexion ;
- console du navigateur sans erreur ;
- upload d'un vrai PDF (`cours-relativite.pdf`, 27 061 caractères extraits), texte affiché ;
- faux PDF (`.txt` renommé en `.pdf`) : message clair ;
- URL d'un document sans session : redirection vers `/login` ;
- mauvais mot de passe : message clair ;
- second utilisateur sur l'URL du document du premier : 404, et sa liste est vide.

Génération réelle (PR #6, `gemini-3.5-flash-lite`, `cours-relativite.pdf`, 10 cartes) : 10 cartes
en 4 s, toutes fidèles au PDF, extraits sources corrects. Trois défauts relevés (voir ci-dessous).

## Relecture des PR 1 à 4 (commentaires publiés sur chaque PR)

- Aucun bloquant de sécurité ni d'isolation : toutes les requêtes sur les documents sont filtrées par
  `userId`, la 404 ne révèle pas l'existence d'un document, `requireUser()` est appelé dans chaque page
  et action.
- Corrigé en cours de route : un test dépendant de l'ordre d'exécution (`db.test.ts`), supprimé.
- Non bloquants, acceptés et documentés : limite de 72 octets de bcrypt, possibilité de savoir si un email
  a un compte (inhérent au formulaire d'inscription), pas de limite de tentatives de connexion (app
  locale), `pdf.destroy()` absent, limite de 10 Mo dupliquée côté client (évite d'embarquer `unpdf`
  dans le navigateur), cartes en double non détectées.
- Incident de merge : en supprimant la branche de la PR 1 après son merge, GitHub a fermé la PR 2
  empilée dessus. L'agent a recréé la branche, rouvert la PR 2 et l'a rebasée sur `main`. Pour les
  suivantes, il a repassé la PR suivante sur `main` **avant** chaque merge.

## Ce que j'ai corrigé moi-même

- Ordre d'enregistrement du document (voir consigne 2).
- Signalement de la troncature dans l'interface (voir consigne 2).
- Vérification des extraits sur du texte réel : j'ai repéré dans le texte extrait de mon PDF des titres
  aux lettres espacées et des mots coupés en fin de ligne, et demandé de les tolérer, ainsi que de
  demander à Gemini des extraits du corps du texte plutôt que des titres. Résultat : la comparaison se
  fait désormais sans espaces, tirets ni guillemets, avec des tests sur les extraits réels.
- Double numérotation à l'affichage (« 1. 1. Quelle était… ») :
  - **première correction de l'agent, sur la mauvaise cause** : il l'a attribuée au modèle et a ajouté
    « sans numéro » au prompt et un nettoyage du numéro côté serveur. **Mon second test réel a montré
    que le défaut persistait sur des cartes regénérées** : la cause n'était donc pas le modèle ;
  - vraie cause, confirmée en base (aucune question stockée ne commence par un numéro) : la page
    numérotait à deux endroits, la liste `<ol>` (numérotation implicite) et un `{i + 1}.` écrit à la main
    dans le composant ;
  - correction à la source : une seule numérotation, celle de la liste (`list-decimal`). Le nettoyage
    serveur, la consigne « sans numéro » et leur test ont été retirés (code mort).
- Extraits qui citaient des sous-titres (« Le temps ralentit quand on va vite », « La simultanéité est
  relative ») au lieu d'une phrase du corps du texte : le prompt demande « la phrase du corps du texte
  qui contient la réponse », et le serveur refuse un extrait identique à une ligne du texte sans
  ponctuation finale (titre ou sous-titre). Rejouée sur mes 10 cartes réelles, la règle refuse
  exactement les cartes 2 et 3 et accepte les 8 autres.
- Qualité pédagogique : les cartes venaient surtout du début du document et portaient sur des anecdotes
  (dates, noms). Le prompt demande maintenant des cartes réparties sur tout le document, centrées sur
  les notions clés et leurs explications, avec des réponses complètes (le résultat d'une expérience,
  pas seulement sa méthode). Le prompt reste court et générique (aucun exemple propre à la relativité).
- Progression trop rapide pour être lue (génération en 4 s) : sans ralentissement artificiel, les étapes
  restent affichées une fois la génération finie, toutes cochées, avec un message de succès.
