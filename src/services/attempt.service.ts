/**
 * Service de tentatives — côté client.
 *
 * - Soumet une activité Strava pour validation (appelle la Cloud Function).
 * - Récupère les tentatives du coureur depuis Firestore.
 * - La validation réelle se passe entièrement côté Cloud Function.
 */
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { functions, db } from './firebase';
import type { Attempt } from '@/types/attempt.types';

const CURRENT_SEASON = '2026';

// ─── Soumission d'une tentative ───────────────────────────────────────────────

export interface SubmitAttemptParams {
  raceId: string;
  stravaActivityId: string;
  season?: string;
}

export interface SubmitAttemptResult {
  attemptId: string;
  status: 'valid' | 'rejected' | 'pending';
  rejectionReason?: string;
  officialTimeSeconds?: number;
  gpsMatchScore?: number;
  checkpointsPassed?: number;
  isBestTime?: boolean;
}

/**
 * Soumet une activité Strava pour validation à la Cloud Function.
 * La fonction effectue toute la validation côté serveur et retourne le résultat.
 */
export async function submitAttempt(
  params: SubmitAttemptParams,
): Promise<SubmitAttemptResult> {
  const fn = httpsCallable<SubmitAttemptParams, SubmitAttemptResult>(
    functions,
    'validateAttempt',
  );
  const { data } = await fn({
    ...params,
    season: params.season ?? CURRENT_SEASON,
  });
  return data;
}

// ─── Lecture des tentatives ───────────────────────────────────────────────────

/** Récupère toutes les tentatives d'un utilisateur pour une saison. */
export async function fetchUserAttempts(
  uid: string,
  season = CURRENT_SEASON,
): Promise<Attempt[]> {
  const snap = await getDocs(
    query(
      collection(db, 'attempts'),
      where('userId', '==', uid),
      where('season', '==', season),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt));
}

/** Récupère une tentative par son ID. */
export async function fetchAttemptById(
  attemptId: string,
): Promise<Attempt | null> {
  const snap = await getDoc(doc(db, 'attempts', attemptId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Attempt;
}
