/** Convertit des secondes en chaîne lisible "H:MM:SS" ou "MM:SS". */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Formate une distance en km avec 1 décimale si < 10 km. */
export function formatDistance(km: number): string {
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

/** Formate un dénivelé positif en mètres. */
export function formatElevation(m: number): string {
  return `+${Math.round(m)} m`;
}

/** Formate une date ISO en "jj mmm aaaa" (fr). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
