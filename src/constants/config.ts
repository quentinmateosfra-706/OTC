/**
 * Configuration de l'application, lue depuis les variables
 * d'environnement (préfixe EXPO_PUBLIC_ pour être exposées au client).
 *
 * On centralise et on type tout ici : aucun `process.env` éparpillé
 * dans le reste du code.
 */

/** Récupère une variable d'env, avec valeur de repli explicite. */
function env(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const config = {
  firebase: {
    apiKey: env('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: env('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: env('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: env('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  strava: {
    clientId: env('EXPO_PUBLIC_STRAVA_CLIENT_ID'),
  },
  mapbox: {
    token: env('EXPO_PUBLIC_MAPBOX_TOKEN'),
  },
  revenueCat: {
    iosKey: env('EXPO_PUBLIC_REVENUECAT_IOS_KEY'),
  },
  // Région des Cloud Functions (proche de la France pour la latence).
  functionsRegion: 'europe-west1',
} as const;

/** Vrai si la config Firebase semble renseignée (sinon mode démo). */
export const isFirebaseConfigured = config.firebase.apiKey.length > 0
  && config.firebase.apiKey !== 'TODO';
