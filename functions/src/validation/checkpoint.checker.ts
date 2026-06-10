/**
 * Vérification des checkpoints virtuels.
 *
 * Règles :
 * - 100 % des checkpoints doivent être franchis.
 * - Dans l'ordre (order croissant).
 * - Dans un rayon `radiusM` autour des coordonnées du checkpoint.
 *
 * On cherche, pour chaque checkpoint, le premier point GPS de l'activité
 * qui se trouve dans le rayon — et on exige que les indices progressent
 * (pour garantir l'ordre de passage).
 */
import { haversineM } from './frechet';
import type { GeoPoint } from './frechet';

interface Checkpoint {
  order: number;
  lat: number;
  lng: number;
  radiusM: number;
}

export interface CheckpointResult {
  passed: boolean;
  checkpointsPassed: number;
  totalCheckpoints: number;
  firstFailedOrder?: number;
  reason?: string;
}

/**
 * Vérifie le franchissement de tous les checkpoints dans l'ordre.
 *
 * @param activityPoints  Points GPS de l'activité importée.
 * @param checkpoints     Checkpoints de la course (triés par order).
 */
export function verifyCheckpoints(
  activityPoints: GeoPoint[],
  checkpoints: Checkpoint[],
): CheckpointResult {
  if (checkpoints.length === 0) {
    return { passed: true, checkpointsPassed: 0, totalCheckpoints: 0 };
  }

  // Trie les checkpoints par ordre croissant.
  const sorted = [...checkpoints].sort((a, b) => a.order - b.order);

  let lastMatchIndex = -1;
  let passed = 0;

  for (const cp of sorted) {
    let found = false;

    // On cherche le point le plus proche dans le rayon,
    // après l'index du dernier checkpoint franchi (ordre garanti).
    for (let i = lastMatchIndex + 1; i < activityPoints.length; i++) {
      const dist = haversineM(activityPoints[i], { lat: cp.lat, lng: cp.lng });
      if (dist <= cp.radiusM) {
        lastMatchIndex = i;
        found = true;
        passed++;
        break;
      }
    }

    if (!found) {
      return {
        passed: false,
        checkpointsPassed: passed,
        totalCheckpoints: sorted.length,
        firstFailedOrder: cp.order,
        reason: `Checkpoint ${cp.order} non franchi `
          + `(rayon requis : ${cp.radiusM} m). `
          + 'Vérifie que ton activité couvre bien l'intégralité du parcours.',
      };
    }
  }

  return {
    passed: true,
    checkpointsPassed: passed,
    totalCheckpoints: sorted.length,
  };
}
