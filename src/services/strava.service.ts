/**
 * Service Strava — côté client.
 *
 * Responsabilités :
 * 1. Initier le flux OAuth (PKCE via expo-auth-session).
 * 2. Passer le `code` à la Cloud Function qui échange les tokens
 *    et les stocke côté serveur (le client ne voit JAMAIS le client_secret).
 * 3. Récupérer la liste des activités récentes via la Cloud Function
 *    (qui utilise l'access_token stocké, avec refresh automatique).
 *
 * ⚠️ Aucun token OAuth ne transite ici. Ce fichier ne manipule que des
 * codes d'autorisation à usage unique et des réponses de Functions.
 */
import { makeRedirectUri } from 'expo-auth-session';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc } from 'firebase/firestore';
import { functions, db } from './firebase';
import { config } from '@/constants/config';
import type { StravaActivity, StravaTokenResult } from '@/types/strava.types';

// ─── Configuration OAuth ─────────────────────────────────────────────────────

export const STRAVA_CLIENT_ID = config.strava.clientId;

/** Scopes nécessaires : lecture des activités (tracks GPS inclus). */
export const STRAVA_SCOPES = ['activity:read_all'];

/**
 * URI de redirection après autorisation Strava.
 *
 * - En dev Expo Go : schéma `exp://` → ne fonctionne PAS avec Strava
 *   (Strava n'autorise que les schemes personnalisés ou https).
 *   Il faut un dev build pour tester le OAuth complet.
 * - En production : `otc://strava-callback`
 *
 * On expose les deux pour que l'URL de redirection soit toujours cohérente
 * avec l'environnement. À enregistrer dans l'app Strava (developers.strava.com).
 */
export function getStravaRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'otc',
    path: 'strava-callback',
  });
}

/** URL d'autorisation Strava (page web). */
export function buildStravaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: getStravaRedirectUri(),
    response_type: 'code',
    approval_prompt: 'auto',
    scope: STRAVA_SCOPES.join(','),
    state,
  });
  return `https://www.strava.com/oauth/mobile/authorize?${params.toString()}`;
}

// ─── Échange du code (via Cloud Function) ───────────────────────────────────

/**
 * Envoie le `code` d'autorisation à la Cloud Function `stravaExchangeToken`.
 * La fonction échange le code contre les tokens, les chiffre et les stocke
 * dans `_stravaTokens/{uid}`. Elle renvoie uniquement l'athleteId et le nom.
 */
export async function exchangeStravaCode(
  code: string,
): Promise<StravaTokenResult> {
  const fn = httpsCallable<{ code: string }, StravaTokenResult>(
    functions,
    'stravaExchangeToken',
  );
  const result = await fn({ code });
  return result.data;
}

/**
 * Met à jour le champ `strava` du profil Firestore après connexion réussie.
 * Appelé côté client juste après exchangeStravaCode.
 */
export async function markStravaConnected(
  uid: string,
  athleteId: string,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { strava: { connected: true, athleteId } },
    { merge: true },
  );
}

/**
 * Déconnecte Strava : réinitialise le champ profil.
 * Les tokens côté serveur sont supprimés par la Cloud Function `stravaRevoke`.
 */
export async function disconnectStrava(uid: string): Promise<void> {
  const fn = httpsCallable(functions, 'stravaRevoke');
  await fn({});
  await setDoc(
    doc(db, 'users', uid),
    { strava: { connected: false, athleteId: null } },
    { merge: true },
  );
}

// ─── Récupération des activités (via Cloud Function) ────────────────────────

/**
 * Récupère les activités Strava récentes du coureur.
 * La Cloud Function utilise l'access_token stocké (avec refresh si expiré).
 *
 * @param after  Timestamp Unix — ne renvoyer que les activités après cette date.
 * @param page   Pagination Strava (30 activités par page max).
 */
export async function fetchStravaActivities(
  after?: number,
  page = 1,
): Promise<StravaActivity[]> {
  const fn = httpsCallable<
    { after?: number; page: number },
    { activities: StravaActivity[] }
  >(functions, 'stravaGetActivities');
  const result = await fn({ after, page });
  return result.data.activities;
}
