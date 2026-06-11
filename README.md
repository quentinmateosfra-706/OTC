# OTC — Off Trail Challenge

Application mobile (iOS prioritaire) permettant de courir un trail issu d'une
course officielle **en totale autonomie**, de valider automatiquement le
parcours via des checkpoints virtuels, et de s'inscrire à un classement annuel.

> « Pas de balisage. Pas de ravito. Pas de spectateurs. »

## Pile technique

- **Mobile** : React Native + Expo (SDK 51), TypeScript
- **Backend** : Firebase (Auth, Firestore, Storage, Cloud Functions — région `europe-west1`)
- **État** : Zustand
- **Cartes** : Mapbox (Phase 5 — nécessitera un *dev build*)
- **Sport** : Strava (V1), Garmin (V2)
- **Paiement** : RevenueCat (in-app) + Stripe (web)

## Démarrage rapide

```bash
npm install
cp .env.example .env   # puis remplir les clés (voir ci-dessous)
npm start              # ouvre Expo ; scanner le QR code avec l'app Expo Go
```

> ⚠️ Phase 1 : l'app affiche l'écran « Manifeste » (vitrine du thème).
> Elle fonctionne **sans clé** en mode démo.

## Où coller mes clés (plus tard, étape par étape)

Tout se passe dans le fichier `.env` (copié depuis `.env.example`). On le
remplira ensemble au fil des phases — rien à faire pour l'instant :

| Clé | Quand | Où la trouver |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_*` | Phase 3 (Auth) | Console Firebase → Paramètres du projet |
| `EXPO_PUBLIC_STRAVA_CLIENT_ID` | Phase 4 | developers.strava.com → ton app → "My API Application" |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Phase 5 | Compte Mapbox → Access tokens |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Phase 6 | Tableau de bord RevenueCat |

Les **vrais secrets** (Strava `client_secret`, clés de paiement) ne vont
**jamais** dans l'app : ils vivent côté Cloud Functions (Phase 4+).

## Configuration Strava (Phase 4)

Sur [developers.strava.com](https://developers.strava.com) → ton app :
- **Authorization Callback Domain** : `localhost` (dev) et `otc.app` (prod)
- **Redirect URI à enregistrer** : `otc://strava-callback`
- Côté Functions (secrets Firebase) : voir `functions/.env.example`

## Structure du projet

Voir `/src` (mobile), `/functions` (backend), `/admin` (back-office Next.js).
Séparation stricte **logique / UI / services** : aucune logique métier dans
les composants d'écran.

## Avancement

- [x] **Phase 1 — Setup** : projet Expo, TypeScript, thème, config Firebase, types, règles de sécurité
- [x] **Phase 2 — Navigation** : aiguillage Auth/App, AuthStack, AppStack, MainTabs
- [x] **Phase 3 — Auth** : email/Apple/Google, profil coureur, décharge de responsabilité horodatée
- [x] **Phase 4 — Strava** : OAuth PKCE (expo-auth-session), échange de code + tokens chiffrés AES-256-GCM côté Functions, refresh automatique, récupération activités
- [x] **Phase 5 — Catalogue** : liste filtrée par distance/région, pagination Firestore, RaceCard, fiche course avec carte Mapbox + profil altimétrique SVG + checkpoints
- [x] **Phase 6 — Achat** : RevenueCat (iOS in-app), Stripe Checkout (web), webhooks Functions, bibliothèque du coureur, abonnements mensuel/annuel
- [x] **Phase 7 — Validation** : SafetyBriefing (checklist adaptative), ImportActivity (sélection Strava), validateAttempt (Fréchet + corridor 30m + checkpoints + sens + anti-triche), AttemptResult
- [ ] Phase 5 — Catalogue de courses
- [ ] Phase 6 — Achat
- [ ] Phase 7 — Import activité + validation
- [ ] Phase 8 — Classement
- [x] **Phase 9 — Admin** : back-office Next.js (courses, utilisateurs, tentatives, revenus)
- [ ] Phase 10 — Tests
