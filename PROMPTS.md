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

## Ce que j'ai corrigé moi-même

- Ordre d'enregistrement du document (voir consigne 2).
- Signalement de la troncature dans l'interface (voir consigne 2).
