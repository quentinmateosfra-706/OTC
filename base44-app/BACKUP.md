# Sauvegarde de l'app web Base44 — avant refonte visuelle

Ce dossier contient le code source de l'app web OTC hébergée sur Base44, telle qu'elle était en ligne le 14 octobre 2026 :
https://off-trail-challenge.base44.app

- App Base44 : `6a9c42213d7fafdfd30ea1d7`
- Point de restauration Base44 : `6acfc67d83882433cab5e7fd` (« Bandeau Installe OTC »)
- Commit Base44 : `b31792d573e82cea10c08ba5473a945a9edad5d3`

Contenu : pages et composants React (`src/`), fonctions backend (`base44/functions/`), modules partagés (`base44/shared/`) et schémas de données (`base44/entities/`). Les dépendances (`node_modules`), le build (`dist`) et les fichiers `.env` ne sont pas inclus. Les données (courses, tentatives, profils) restent dans Base44 et ne sont pas dans cette sauvegarde.

## Restaurer cette version

1. Le plus simple : dans l'éditeur Base44, historique des versions → restaurer le point « Bandeau « Installe OTC » (mobile, refermable) ».
2. Sinon : réimporter les fichiers de ce dossier dans l'app Base44 (même arborescence), puis redéployer.
