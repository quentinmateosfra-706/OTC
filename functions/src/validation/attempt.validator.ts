/**
 * Cloud Function — validateAttempt.
 *
 * Orchestre la validation complète d'une tentative :
 *
 * 1. Vérifie que l'utilisateur est authentifié et a acheté la course.
 * 2. Récupère l'activité Strava (via API, tokens stockés côté serveur).
 * 3. Télécharge le fichier GPX officiel depuis Firebase Storage.
 * 4. Contrôles anti-triche (activité manuelle, vitesse, Naismith).
 * 5. Vérifie la fenêtre de dates [startDate, endDate].
 * 6. Vérification du sens du parcours.
 * 7. Map matching (corridor 30 m, seuil 85 %, Fréchet).
 * 8. Vérification des checkpoints dans l'ordre.
 * 9. Si valide : calcul du temps officiel, mise à jour du leaderboard.
 * 10. Écrit le document `attempts/{id}` avec le résultat.
 *
 * Retourne le résultat immédiatement (function synchrone du point de vue client).
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { validateTrace, checkDirection } from './frechet';
import { parseGpx, traceDurationSeconds } from './gpx.parser';
import { checkAntiCheat, checkNaismith } from './anticheat';
import { verifyCheckpoints } from './checkpoint.checker';
import type { GeoPoint, TrackPoint } from './frechet';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();
const region = 'europe-west1';

// ─── Helpers Strava ───────────────────────────────────────────────────────────

interface StravaStream {
  type: string;
  data: number[];
}

async function getStravaActivityStreams(
  athleteActivityId: string,
  accessToken: string,
): Promise<{ latlng: [number, number][]; time: number[]; altitude: number[] }> {
  const { default: fetch } = await import('node-fetch');
  const url = `https://www.strava.com/api/v3/activities/${athleteActivityId}/streams`
    + '?keys=latlng,time,altitude&key_by_type=true';

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    throw new Error(`Strava streams API error: ${res.status}`);
  }

  const json = await res.json() as Record<string, StravaStream>;
  return {
    latlng: (json.latlng?.data ?? []) as [number, number][],
    time: (json.time?.data ?? []) as number[],
    altitude: (json.altitude?.data ?? []) as number[],
  };
}

async function getStravaActivity(
  athleteActivityId: string,
  accessToken: string,
): Promise<{
  start_date: string;
  elapsed_time: number;
  distance: number;
  total_elevation_gain: number;
  manual: boolean;
  trainer: boolean;
}> {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(
    `https://www.strava.com/api/v3/activities/${athleteActivityId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Strava activity API error: ${res.status}`);
  return res.json() as Promise<{
    start_date: string;
    elapsed_time: number;
    distance: number;
    total_elevation_gain: number;
    manual: boolean;
    trainer: boolean;
  }>;
}

// ─── Récupère et déchiffre les tokens Strava stockés ─────────────────────────

async function getValidAccessToken(uid: string): Promise<string> {
  // On réutilise la logique de strava.oauth.ts (simplifiée ici pour éviter
  // la dépendance circulaire — en production extraire dans un module commun).
  const encKey = process.env.TOKEN_ENCRYPTION_KEY;
  if (!encKey) throw new functions.https.HttpsError('internal', 'Clé de chiffrement manquante.');

  const snap = await db.collection('_stravaTokens').doc(uid).get();
  if (!snap.exists) throw new functions.https.HttpsError('failed-precondition', 'Strava non connecté.');

  const data = snap.data()!;
  const { decrypt } = await import('./crypto.helper');
  const accessToken = decrypt(data.accessToken as string, encKey);
  const refreshToken = decrypt(data.refreshToken as string, encKey);
  const expiresAt = data.expiresAt as number;
  const nowS = Math.floor(Date.now() / 1000);

  if (expiresAt <= nowS + 300) {
    // Refresh.
    const { default: fetch } = await import('node-fetch');
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: refreshToken }),
    });
    if (!res.ok) throw new functions.https.HttpsError('internal', 'Refresh token Strava échoué.');
    const refreshed = await res.json() as { access_token: string; refresh_token: string; expires_at: number };
    const { encrypt } = await import('./crypto.helper');
    await db.collection('_stravaTokens').doc(uid).update({
      accessToken: encrypt(refreshed.access_token, encKey),
      refreshToken: encrypt(refreshed.refresh_token, encKey),
      expiresAt: refreshed.expires_at,
    });
    return refreshed.access_token;
  }

  return accessToken;
}

// ─── Mise à jour du leaderboard ───────────────────────────────────────────────

async function updateLeaderboard(
  uid: string,
  raceId: string,
  season: string,
  timeSeconds: number,
): Promise<boolean> {
  const lbId = `${raceId}_${season}`;
  const entryRef = db.collection('leaderboard').doc(lbId).collection('entries').doc(uid);

  return db.runTransaction(async (t) => {
    const snap = await t.get(entryRef);
    if (snap.exists) {
      const current = snap.data()!.bestTimeSeconds as number;
      if (timeSeconds >= current) return false; // pas d'amélioration
    }

    const userSnap = await t.get(db.collection('users').doc(uid));
    const user = userSnap.data() ?? {};

    t.set(entryRef, {
      userId: uid,
      displayName: user.displayName ?? 'Anonyme',
      club: user.club ?? null,
      bestTimeSeconds: timeSeconds,
      region: user.region ?? null,
      sex: user.sex ?? null,
      ageBracket: 'Senior', // calculé plus finement en Phase 8
      category: `S${user.sex ?? 'H'}`,
      rank: 0, // recalculé par une Function planifiée
    });

    return true;
  });
}

// ─── Cloud Function principale ────────────────────────────────────────────────

export const validateAttempt = functions
  .region(region)
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(
    async (
      data: { raceId: string; stravaActivityId: string; season: string },
      context,
    ) => {
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentification requise.');
      }

      const uid = context.auth.uid;
      const { raceId, stravaActivityId, season } = data;

      // ── 1. Vérifie l'achat ────────────────────────────────────────────────
      const purchaseSnap = await db
        .collection('purchases')
        .where('userId', '==', uid)
        .where('raceId', '==', raceId)
        .where('season', '==', season)
        .where('status', '==', 'completed')
        .limit(1)
        .get();

      const subSnap = await db.collection('subscriptions').doc(uid).get();
      const hasSub = subSnap.exists && (subSnap.data()!.status as string) === 'active';

      if (purchaseSnap.empty && !hasSub) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Tu n'as pas accès à cette course. Achète-la d'abord.',
        );
      }

      // ── 2. Récupère la course ─────────────────────────────────────────────
      const raceSnap = await db.collection('races').doc(raceId).get();
      if (!raceSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Course introuvable.');
      }
      const race = raceSnap.data()!;
      const validation = race.validation as {
        corridorToleranceM: number;
        matchThreshold: number;
      };

      // ── 3. Vérifie la fenêtre de dates ────────────────────────────────────
      const now = new Date();
      const start = (race.startDate as admin.firestore.Timestamp).toDate();
      const end = (race.endDate as admin.firestore.Timestamp).toDate();
      if (now < start || now > end) {
        return reject('La fenêtre de tentative est fermée pour cette course.');
      }

      // ── 4. Récupère les tokens Strava et l'activité ────────────────────────
      let accessToken: string;
      try {
        accessToken = await getValidAccessToken(uid);
      } catch {
        return reject('Impossible de récupérer tes tokens Strava. Reconnecte ton compte.');
      }

      const [stravaActivity, streams] = await Promise.all([
        getStravaActivity(stravaActivityId, accessToken).catch(() => null),
        getStravaActivityStreams(stravaActivityId, accessToken).catch(() => null),
      ]);

      if (!stravaActivity || !streams || !streams.latlng.length) {
        return reject('Activité Strava introuvable ou sans trace GPS.');
      }

      // ── 5. Anti-triche ────────────────────────────────────────────────────
      const activityPoints: TrackPoint[] = streams.latlng.map(([lat, lng], i) => ({
        lat,
        lng,
        ele: streams.altitude[i],
        timeIso: stravaActivity.start_date
          ? new Date(new Date(stravaActivity.start_date).getTime() + (streams.time[i] ?? 0) * 1000).toISOString()
          : undefined,
      }));

      const antiCheat = checkAntiCheat(
        activityPoints,
        stravaActivity.manual,
        stravaActivity.trainer,
      );
      if (!antiCheat.passed) return reject(antiCheat.reason!);

      const durationS = traceDurationSeconds(activityPoints) ?? stravaActivity.elapsed_time;
      const naismith = checkNaismith(
        stravaActivity.distance,
        stravaActivity.total_elevation_gain,
        durationS,
      );
      if (!naismith.passed) return reject(naismith.reason!);

      // ── 6. Vérifie la date de l'activité ──────────────────────────────────
      const activityDate = new Date(stravaActivity.start_date);
      if (activityDate < start || activityDate > end) {
        return reject(
          `L'activité du ${activityDate.toLocaleDateString('fr-FR')} est hors de la fenêtre `
          + `de tentative (${start.toLocaleDateString('fr-FR')} – ${end.toLocaleDateString('fr-FR')}).`,
        );
      }

      // ── 7. Télécharge et parse le GPX officiel ────────────────────────────
      let referencePoints: GeoPoint[];
      try {
        const bucket = storage.bucket();
        const [gpxBuffer] = await bucket.file(race.gpxStoragePath as string).download();
        referencePoints = parseGpx(gpxBuffer.toString('utf8'));
      } catch {
        return reject('Impossible de télécharger le fichier GPX officiel. Réessaie plus tard.');
      }

      if (referencePoints.length < 10) {
        return reject('Le fichier GPX officiel est invalide ou trop court.');
      }

      // ── 8. Sens du parcours ───────────────────────────────────────────────
      const directionOk = checkDirection(activityPoints, referencePoints);
      if (!directionOk) {
        return reject(
          'Le parcours semble avoir été effectué dans le mauvais sens. '
          + 'OTC impose le sens unique défini par la trace officielle.',
        );
      }

      // ── 9. Map matching (Fréchet + corridor) ─────────────────────────────
      const matchResult = validateTrace(
        activityPoints,
        referencePoints,
        validation.corridorToleranceM ?? 30,
        validation.matchThreshold ?? 0.85,
      );

      if (!matchResult.isValid) {
        const scoreStr = `${Math.round(matchResult.matchScore * 100)} %`;
        return reject(
          `La trace GPS ne correspond pas suffisamment au parcours officiel `
          + `(${scoreStr} dans le corridor de ${validation.corridorToleranceM ?? 30} m, `
          + `minimum requis : ${Math.round((validation.matchThreshold ?? 0.85) * 100)} %). `
          + 'Vérifie que tu as bien suivi l'itinéraire OTC et non un autre sentier.',
        );
      }

      // ── 10. Checkpoints ───────────────────────────────────────────────────
      const checkpoints = (race.checkpoints ?? []) as Array<{
        order: number; lat: number; lng: number; radiusM: number;
      }>;
      const cpResult = verifyCheckpoints(activityPoints, checkpoints);
      if (!cpResult.passed) {
        return reject(cpResult.reason!);
      }

      // ── 11. Calcul du temps officiel ──────────────────────────────────────
      const officialTimeSeconds = durationS;

      // ── 12. Écrit la tentative validée ────────────────────────────────────
      const attemptRef = db.collection('attempts').doc();
      const isBestTime = await updateLeaderboard(uid, raceId, season, officialTimeSeconds);

      await attemptRef.set({
        userId: uid,
        raceId,
        season,
        stravaActivityId,
        importedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'valid',
        rejectionReason: null,
        activityDate: admin.firestore.Timestamp.fromDate(activityDate),
        officialTimeSeconds,
        gpsMatchScore: matchResult.matchScore,
        checkpointsPassed: cpResult.checkpointsPassed,
        isBestTime,
        safetyAcknowledgedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Attempt valid', {
        uid, raceId, season, officialTimeSeconds, isBestTime,
      });

      return {
        attemptId: attemptRef.id,
        status: 'valid',
        officialTimeSeconds,
        gpsMatchScore: matchResult.matchScore,
        checkpointsPassed: cpResult.checkpointsPassed,
        isBestTime,
      };

      // ─────────────────────────────────────────────────────────────────────
      async function reject(reason: string) {
        const attemptRef2 = db.collection('attempts').doc();
        await attemptRef2.set({
          userId: uid,
          raceId,
          season,
          stravaActivityId,
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'rejected',
          rejectionReason: reason,
          activityDate: stravaActivity
            ? admin.firestore.Timestamp.fromDate(new Date(stravaActivity.start_date))
            : null,
          officialTimeSeconds: null,
          gpsMatchScore: null,
          checkpointsPassed: null,
          isBestTime: false,
          safetyAcknowledgedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info('Attempt rejected', { uid, raceId, reason });
        return { attemptId: attemptRef2.id, status: 'rejected', rejectionReason: reason };
      }
    },
  );
