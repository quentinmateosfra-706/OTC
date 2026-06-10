/**
 * Service d'accès aux achats Firestore.
 *
 * - Lit `purchases` (collection) et `subscriptions/{uid}`.
 * - Les écritures se font uniquement via webhooks (Stripe / RevenueCat)
 *   côté Cloud Functions — le client ne crée jamais de document d'achat.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Purchase, Subscription } from '@/types/purchase.types';

/** Charge tous les achats d'un utilisateur pour une saison donnée. */
export async function fetchUserPurchases(
  uid: string,
  season: string,
): Promise<Purchase[]> {
  const snap = await getDocs(
    query(
      collection(db, 'purchases'),
      where('userId', '==', uid),
      where('season', '==', season),
      where('status', '==', 'completed'),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Purchase));
}

/** Charge l'abonnement actif d'un utilisateur (null si aucun). */
export async function fetchSubscription(uid: string): Promise<Subscription | null> {
  const snap = await getDoc(doc(db, 'subscriptions', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Subscription;
  // On ignore les abonnements expirés.
  if (data.status !== 'active') return null;
  return data;
}

/** Vérifie si l'utilisateur a acheté une course spécifique. */
export async function hasPurchasedRace(
  uid: string,
  raceId: string,
  season: string,
): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'purchases'),
      where('userId', '==', uid),
      where('raceId', '==', raceId),
      where('season', '==', season),
      where('status', '==', 'completed'),
    ),
  );
  return !snap.empty;
}
