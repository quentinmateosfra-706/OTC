/**
 * Cloud Functions — OAuth Strava (europe-west1).
 *
 * Trois fonctions appelables (httpsCallable) :
 *
 * 1. `stravaExchangeToken` — reçoit le code d'autorisation, l'échange contre
 *    les tokens access/refresh, les chiffre avec AES-256-GCM et les stocke
 *    dans `_stravaTokens/{uid}` (collection inaccessible côté client).
 *
 * 2. `stravaRevoke` — révoque les tokens auprès de Strava et supprime
 *    le document `_stravaTokens/{uid}`.
 *
 * 3. `stravaGetActivities` — récupère les activités récentes. Gère le
 *    refresh automatique si l'access_token est expiré.
 *
 * ─── Sécurité ───────────────────────────────────────────────────────────────
 * - `client_secret` Strava : variable d'environnement Functions (jamais dans le code).
 * - Tokens chiffrés : AES-256-GCM avec IV aléatoire, clé dans les secrets Functions.
 * - Seul l'utilisateur authentifié peut appeler ces fonctions (context.auth requis).
 * - La collection `_stravaTokens` est interdite côté client (rules: deny all).
 *
 * ─── Rate limits Strava ─────────────────────────────────────────────────────
 * Limites API Strava : 100 req/15 min et 1000 req/jour par application.
 * On ne fait qu'un appel par import (pas de polling). Le refresh n'est
 * déclenché que si l'access_token est expiré (< 5 min de marge).
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Initialisation Firebase Admin (singleton).
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const region = 'europe-west1';

// ─── Constantes chiffrées ────────────────────────────────────────────────────

/** Longueur de la clé AES-256 en octets. */
const KEY_LENGTH = 32;

/** Longueur de l'IV pour AES-256-GCM. */
const IV_LENGTH = 16;

/** Longueur du tag d'authentification GCM. */
const TAG_LENGTH = 16;

/**
 * Chiffre une chaîne avec AES-256-GCM.
 * Retourne `iv:tag:ciphertext` encodé en base64 (séparateur `:`).
 */
function encrypt(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== KEY_LENGTH) throw new Error('Clé de chiffrement invalide (32 octets requis)');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Déchiffre une chaîne chiffrée avec AES-256-GCM. */
function decrypt(ciphertext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const [ivB64, tagB64, dataB64] = ciphertext.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Format de token chiffré invalide');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

// ─── Helpers Strava ──────────────────────────────────────────────────────────

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  athlete: { id: number; firstname: string; lastname: string };
}

async function stravaTokenRequest(
  body: Record<string, string>,
): Promise<StravaTokenResponse> {
  const { default: fetch } = await import('node-fetch');
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientSecret || !clientId) {
    throw new functions.https.HttpsError(
      'internal',
      'Variables d'environnement Strava manquantes.',
    );
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, ...body }),
  });

  if (!res.ok) {
    const text = await res.text();
    functions.logger.error('Strava token error', { status: res.status, body: text });
    throw new functions.https.HttpsError('internal', 'Erreur Strava lors de l'échange de token.');
  }

  return res.json() as Promise<StravaTokenResponse>;
}

/** Récupère et déchiffre les tokens stockés pour un utilisateur. */
async function getStoredTokens(uid: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}> {
  const encKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!encKey) throw new functions.https.HttpsError('internal', 'Clé de chiffrement manquante.');

  const snap = await db.collection('_stravaTokens').doc(uid).get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Aucun token Strava trouvé pour cet utilisateur.');
  }
  const data = snap.data()!;
  return {
    accessToken: decrypt(data.accessToken, encKey),
    refreshToken: decrypt(data.refreshToken, encKey),
    expiresAt: data.expiresAt as number,
  };
}

/** Stocke les tokens chiffrés dans Firestore. */
async function storeTokens(
  uid: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  athleteId: string,
): Promise<void> {
  const encKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!encKey) throw new functions.https.HttpsError('internal', 'Clé de chiffrement manquante.');

  await db.collection('_stravaTokens').doc(uid).set({
    accessToken: encrypt(accessToken, encKey),
    refreshToken: encrypt(refreshToken, encKey),
    expiresAt,
    athleteId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Retourne un access_token valide. Si expiré (ou expire dans < 5 min),
 * déclenche un refresh et met à jour Firestore.
 */
async function getValidAccessToken(uid: string): Promise<string> {
  const stored = await getStoredTokens(uid);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const margin = 5 * 60; // 5 minutes de marge

  if (stored.expiresAt > nowSeconds + margin) {
    return stored.accessToken;
  }

  // Refresh nécessaire.
  functions.logger.info('Refresh token Strava', { uid });
  const refreshed = await stravaTokenRequest({
    grant_type: 'refresh_token',
    refresh_token: stored.refreshToken,
  });

  await storeTokens(
    uid,
    refreshed.access_token,
    refreshed.refresh_token,
    refreshed.expires_at,
    String(refreshed.athlete.id),
  );

  return refreshed.access_token;
}

// ─── Cloud Functions exportées ───────────────────────────────────────────────

/**
 * stravaExchangeToken — échange le code OAuth contre des tokens.
 * Appelée depuis le client juste après l'autorisation Strava.
 */
export const stravaExchangeToken = functions
  .region(region)
  .https.onCall(async (data: { code: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }
    if (!data.code || typeof data.code !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Code d'autorisation manquant.');
    }

    const uid = context.auth.uid;
    functions.logger.info('stravaExchangeToken', { uid });

    const tokenData = await stravaTokenRequest({
      code: data.code,
      grant_type: 'authorization_code',
    });

    await storeTokens(
      uid,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_at,
      String(tokenData.athlete.id),
    );

    // On enregistre aussi le consentement de connexion Strava.
    await db
      .collection('users')
      .doc(uid)
      .collection('consents')
      .doc('strava_link')
      .set({
        type: 'strava_link',
        version: '2026-01-v1',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: null,
      });

    return {
      athleteId: String(tokenData.athlete.id),
      firstname: tokenData.athlete.firstname,
      lastname: tokenData.athlete.lastname,
    };
  });

/**
 * stravaRevoke — révoque les tokens et supprime le document.
 */
export const stravaRevoke = functions
  .region(region)
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }
    const uid = context.auth.uid;

    try {
      const stored = await getStoredTokens(uid);
      // Révocation auprès de Strava (best effort — on supprime même si ça échoue).
      const { default: fetch } = await import('node-fetch');
      await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${stored.accessToken}` },
      }).catch((e) => functions.logger.warn('stravaRevoke deauth failed', e));
    } catch {
      // Token déjà absent — OK.
    }

    await db.collection('_stravaTokens').doc(uid).delete();
    functions.logger.info('stravaRevoke', { uid });
    return { success: true };
  });

/**
 * stravaGetActivities — récupère les activités récentes (avec refresh auto).
 * Retourne uniquement les activités de type course (Run/TrailRun/Hike).
 */
export const stravaGetActivities = functions
  .region(region)
  .https.onCall(async (data: { after?: number; page?: number }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
    }

    const uid = context.auth.uid;
    const page = data.page ?? 1;
    const perPage = 30;

    const accessToken = await getValidAccessToken(uid);

    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      ...(data.after ? { after: String(data.after) } : {}),
    });

    const { default: fetch } = await import('node-fetch');
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      functions.logger.error('stravaGetActivities failed', { status: res.status, uid });
      throw new functions.https.HttpsError('internal', 'Impossible de récupérer les activités Strava.');
    }

    const all = (await res.json()) as Array<Record<string, unknown>>;

    // Filtre : uniquement les activités de course à pied / trail / rando.
    const running = all.filter((a) =>
      ['Run', 'TrailRun', 'Hike', 'Walk'].includes(String(a.sport_type ?? a.type ?? '')),
    );

    return { activities: running };
  });
