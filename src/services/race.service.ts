/**
 * Service d'accès aux courses Firestore.
 *
 * - Lecture publique (pas d'auth requise).
 * - Pagination du catalogue (30 courses par page).
 * - Cache local minimal : on stocke le résultat dans le store Zustand,
 *   on ne re-fetche que si le cache est vide ou expiré.
 *
 * Optimisation Firestore : on lit `races` en lecture publique (règles OK).
 * Le leaderboard et les GPX sont chargés à la demande (fiche course).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Race } from '@/types/race.types';

const RACES_PER_PAGE = 20;

// ─── Filtres catalogue ───────────────────────────────────────────────────────

export interface RaceFilters {
  region?: string;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  season?: string;
  status?: Race['status'];
}

// ─── Lecture catalogue ───────────────────────────────────────────────────────

/**
 * Récupère une page de courses avec filtres optionnels.
 * `cursor` est le dernier document de la page précédente (pagination Firestore).
 */
export async function fetchRaces(
  filters: RaceFilters = {},
  cursor?: DocumentSnapshot,
): Promise<{ races: Race[]; nextCursor: DocumentSnapshot | null }> {
  const constraints: QueryConstraint[] = [];

  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  } else {
    // Par défaut : seulement les courses actives.
    constraints.push(where('status', '==', 'active'));
  }

  if (filters.season) {
    constraints.push(where('season', '==', filters.season));
  }

  if (filters.region) {
    constraints.push(where('region', '==', filters.region));
  }

  constraints.push(orderBy('distanceKm', 'asc'));
  constraints.push(limit(RACES_PER_PAGE));

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  const snap = await getDocs(query(collection(db, 'races'), ...constraints));

  const races = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Race));

  // Filtre distance côté client (Firestore ne supporte pas deux inégalités
  // sur des champs différents sans index composite).
  const filtered = races.filter((r) => {
    if (filters.minDistanceKm !== undefined && r.distanceKm < filters.minDistanceKm) return false;
    if (filters.maxDistanceKm !== undefined && r.distanceKm > filters.maxDistanceKm) return false;
    return true;
  });

  const nextCursor = snap.docs.length === RACES_PER_PAGE
    ? snap.docs[snap.docs.length - 1]
    : null;

  return { races: filtered, nextCursor };
}

/** Récupère une course par son ID. */
export async function fetchRaceById(raceId: string): Promise<Race | null> {
  const snap = await getDoc(doc(db, 'races', raceId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Race;
}

/** Retourne la liste des régions disponibles (dédoublonnée, triée). */
export async function fetchAvailableRegions(): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, 'races'), where('status', '==', 'active')),
  );
  const regions = new Set<string>();
  snap.docs.forEach((d) => {
    const r = d.data().region as string | undefined;
    if (r) regions.add(r);
  });
  return Array.from(regions).sort();
}

// ─── GPX ─────────────────────────────────────────────────────────────────────

/** Récupère l'URL de téléchargement du fichier GPX d'une course. */
export async function fetchGpxUrl(gpxStoragePath: string): Promise<string> {
  return getDownloadURL(ref(storage, gpxStoragePath));
}
