/**
 * Module anti-triche — détecte les comportements suspects.
 *
 * Contrôles :
 * 1. Vitesse maximale instantanée (segment trop rapide → véhicule).
 * 2. Cohérence vitesse/dénivelé (Naismith rule : vitesse max diminue avec le D+).
 * 3. Activité manuelle ou home-trainer (rejetée d'emblée).
 * 4. Pauses anormalement longues (> 4 h d'arrêt).
 */
import type { TrackPoint } from './frechet';
import { haversineM } from './frechet';

export interface AntiCheatResult {
  passed: boolean;
  reason?: string;
}

/** Vitesse maximale autorisée en m/s (≈ 10 m/s ≈ 36 km/h — sprinter mondial). */
const MAX_SPEED_MS = 10;

/** Pause maximale autorisée en secondes (4 heures). */
const MAX_PAUSE_S = 4 * 3600;

/**
 * Vérifie les critères anti-triche sur une trace GPS horodatée.
 *
 * @param points      Points GPS de l'activité importée (avec timestamps).
 * @param manual      L'activité a été saisie manuellement (Strava `manual`).
 * @param trainer     Activité home-trainer (Strava `trainer`).
 */
export function checkAntiCheat(
  points: TrackPoint[],
  manual: boolean,
  trainer: boolean,
): AntiCheatResult {
  // Activité manuelle ou indoor → pas de trace GPS → rejetée.
  if (manual) {
    return { passed: false, reason: 'Activité saisie manuellement refusée (pas de trace GPS).' };
  }
  if (trainer) {
    return { passed: false, reason: 'Activité home-trainer refusée.' };
  }

  // Contrôles sur les segments horodatés.
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!a.timeIso || !b.timeIso) continue;

    const dtS = (new Date(b.timeIso).getTime() - new Date(a.timeIso).getTime()) / 1000;
    if (dtS <= 0) continue; // timestamp identique ou désordre → ignoré

    const dist = haversineM(a, b);

    // Vitesse instantanée.
    const speed = dist / dtS;
    if (speed > MAX_SPEED_MS) {
      return {
        passed: false,
        reason: `Vitesse anormalement élevée détectée (${(speed * 3.6).toFixed(0)} km/h). `
          + 'Vérifie que l'activité a bien été enregistrée à pied.',
      };
    }

    // Pause anormalement longue.
    if (dist < 5 && dtS > MAX_PAUSE_S) {
      return {
        passed: false,
        reason: `Pause de plus de ${Math.round(dtS / 3600)} h détectée. `
          + 'Le temps de course doit être continu.',
      };
    }
  }

  return { passed: true };
}

/**
 * Vérifie que la durée totale de l'activité est cohérente avec la distance
 * et le dénivelé positif (règle de Naismith simplifiée).
 *
 * Naismith : 1 h pour 5 km + 1 h pour 600 m D+.
 * On applique un facteur 3× de tolérance (coureurs très rapides).
 */
export function checkNaismith(
  distanceM: number,
  elevationGainM: number,
  durationSeconds: number,
): AntiCheatResult {
  const distKm = distanceM / 1000;
  const naismithHours = distKm / 5 + elevationGainM / 600;
  const naismithSeconds = naismithHours * 3600;

  // Durée minimum = Naismith / 3 (les meilleurs coureurs mondiaux font ~3× Naismith).
  const minDuration = naismithSeconds / 3;

  if (durationSeconds < minDuration) {
    return {
      passed: false,
      reason: `Durée de l'activité (${Math.round(durationSeconds / 60)} min) incohérente `
        + `avec la distance (${distKm.toFixed(0)} km) et le dénivelé (+${Math.round(elevationGainM)} m). `
        + 'Résultat trop rapide pour être réalisé à pied.',
    };
  }

  return { passed: true };
}
