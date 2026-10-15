# OTC — où on en est (15/10/2026)

À lire en début de session. Le récit de Quentin sur le pourquoi d'OTC est dans `docs/pourquoi-otc.md`.

## L'app
- Web app Base44 en ligne : https://off-trail-challenge.base44.app (app ID `6a9c42213d7fafdfd30ea1d7`).
- Sauvegarde du code avant la refonte : `base44-app/` (commit `05f3570`). Le code à jour vit dans Base44 (points de restauration nommés).
- Le dossier `src/` à la racine est l'ancienne app mobile Expo/Firebase, non publiée.

## Fait
- Classement réel (fonction `leaderboard`), par course et général, filtres sexe et catégorie.
- Profil coureur obligatoire, inscription fiabilisée, connexion Google et Apple.
- Strava : connexion, import manuel, import automatique par webhook (`stravaWebhook`), email et notification « course validée ».
- Design « carte au 1:25 000 » : papier `#EEF1EA`, encre `#1D2521`, rouge GR `#C8202B`, Barlow Condensed + Atkinson Hyperlegible, courbes de niveau en fond.
- Cartes : Plan IGN vectoriel sans routes (MapLibre, `public/ign-style.json`), satellite Esri.
- Web app installable (manifest, bandeau « Installe OTC », guide iPhone/Android dans « Comment ça marche »).
- Course de test « Course 1 TEST » (Toulon, 8,74 km), validée par Quentin en 57'58".

## À faire
1. **Réécrire tous les textes du site** à partir de `docs/pourquoi-otc.md` (ils sonnent « IA » aujourd'hui). Faire une liste avant → après par page, la faire valider, puis appliquer.
2. Côté Quentin : supprimer dans Base44 → Data les profils de test « Alice Test » et « Bob Test » ; activer l'import automatique Strava (Profil → « Activer »).
3. Plus tard : ombrage du relief sur les cartes, page « Carte » branchée sur les vraies courses, fiche course et classement mis en page comme la maquette.

## Charte de ton (tirée du récit de Quentin)
- Tutoiement. Phrases courtes. Les mots de Quentin : colline, sentier, trace, montre, ravito, balisage, partir, se débrouiller.
- Des détails concrets plutôt que des formules : Toulon, Annecy, « 7 € au lieu de 70 », « Ai-je pris assez d'eau ? ».
- L'aventure d'abord, le classement ensuite. Ni discours de performance, ni ton de pub.
- À éviter : phrases en trois temps systématiques, tirets à effet, formules lyriques (« la seule ligne de conduite… »), mots « vivre une expérience », « unique », « ultime ».
- Les trois arguments à répéter simplement : ouvert toute l'année, pas cher, à ton rythme.
