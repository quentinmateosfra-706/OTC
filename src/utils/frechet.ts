/**
 * Algorithme de validation géospatiale — partagé entre le client et les
 * Cloud Functions (le fichier est copié dans functions/src/validation/).
 *
 * ─── Approche retenue ────────────────────────────────────────────────────────
 * Deux critères combinés :
 *
 * 1. CORRIDOR MATCH (principal) — pour chaque point GPS de l'activité importée,
 *    on calcule la distance minimale à la trace officielle (projection sur les
 *    segments). Si ≥ `matchThreshold` (85 %) des points tombent dans un corridor
 *    de `corridorToleranceM` mètres, la trace est validée.
 *    → Robuste aux écarts GPS, aux variantes de chemin et aux décalages temporels.
 *
 * 2. FRÉCHET DISCRET (secondaire) — mesure la dissimilarité globale de forme
 *    entre les deux polylignes. Utilisé comme signal d'anti-triche (détecte les
 *    raccourcis importants qui passeraient le filtre corridor).
 *
 * ─── Performances ────────────────────────────────────────────────────────────
 * Les traces GPX sont dé-samplee à max 500 points avant appel pour limiter le
 * coût O(n²) du Fréchet discret.
 */

/** Un point géographique 2D (latitude, longitude). */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Un point GPS avec timestamp optionnel (import Strava). */
export interface TrackPoint extends GeoPoint {
  ele?: number; // altitude en mètres
  timeIso?: string; // ISO 8601
}

/** Résultat de la validation géospatiale. */
export interface MatchResult {
  /** Score : ratio de points de l'activité dans le corridor (0–1). */
  matchScore: number;
  /** Distance de Fréchet discrète en mètres (approximation). */
  frechetDistanceM: number;
  /** Vrai si le tracé valide les deux critères. */
  isValid: boolean;
  /** Nombre de points analysés (après dé-sampling). */
  pointsAnalyzed: number;
}

// ─── Constante géodésique ─────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000;

/**
 * Distance de Haversine entre deux points (mètres).
 * Précision suffisante pour des distances < 100 km.
 */
export function haversineM(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Distance minimale d'un point P au segment [A, B] (en mètres).
 * On projette P sur le segment et on clamp à [0,1].
 */
export function pointToSegmentM(p: GeoPoint, a: GeoPoint, b: GeoPoint): number {
  // Travail en coordonnées locales (mètres) centrées sur A.
  const latScale = EARTH_RADIUS_M * (Math.PI / 180);
  const lngScale = EARTH_RADIUS_M * Math.cos(toRad(a.lat)) * (Math.PI / 180);

  const px = (p.lng - a.lng) * lngScale;
  const py = (p.lat - a.lat) * latScale;
  const bx = (b.lng - a.lng) * lngScale;
  const by = (b.lat - a.lat) * latScale;

  const lenSq = bx * bx + by * by;
  if (lenSq === 0) return Math.sqrt(px * px + py * py);

  const t = Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
  const projX = t * bx - px;
  const projY = t * by - py;
  return Math.sqrt(projX * projX + projY * projY);
}

/**
 * Distance minimale d'un point à une polyline (mètres).
 */
function pointToPolylineM(p: GeoPoint, polyline: GeoPoint[]): number {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentM(p, polyline[i], polyline[i + 1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// ─── Dé-sampling ──────────────────────────────────────────────────────────────

/**
 * Réduit un tableau de points à `maxPoints` points en prélevant
 * uniformément (pour limiter la complexité du Fréchet O(n²)).
 */
export function downsample<T extends GeoPoint>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => points[Math.round(i * step)]);
}

// ─── Corridor match ───────────────────────────────────────────────────────────

/**
 * Calcule le score de corridor : ratio de points de `activity` tombant
 * dans un corridor de `toleranceM` mètres autour de `reference`.
 */
export function corridorMatchScore(
  activity: GeoPoint[],
  reference: GeoPoint[],
  toleranceM: number,
): number {
  if (activity.length === 0 || reference.length < 2) return 0;
  let inCorridor = 0;
  for (const pt of activity) {
    if (pointToPolylineM(pt, reference) <= toleranceM) inCorridor++;
  }
  return inCorridor / activity.length;
}

// ─── Fréchet discret ─────────────────────────────────────────────────────────

/**
 * Distance de Fréchet discrète entre deux polylignes (mètres).
 * Complexité O(n × m) en temps et espace.
 *
 * Pour des traces longues, dé-sampler à ≤ 300 points avant d'appeler.
 */
export function discreteFrechetM(p: GeoPoint[], q: GeoPoint[]): number {
  const n = p.length;
  const m = q.length;
  if (n === 0 || m === 0) return Infinity;

  // Tableau dp[i][j] = distance de Fréchet entre p[0..i] et q[0..j].
  const dp: number[][] = Array.from({ length: n }, () => new Array(m).fill(-1));

  function ca(i: number, j: number): number {
    if (dp[i][j] >= 0) return dp[i][j];
    const d = haversineM(p[i], q[j]);
    if (i === 0 && j === 0) {
      dp[i][j] = d;
    } else if (i === 0) {
      dp[i][j] = Math.max(ca(0, j - 1), d);
    } else if (j === 0) {
      dp[i][j] = Math.max(ca(i - 1, 0), d);
    } else {
      dp[i][j] = Math.max(Math.min(ca(i - 1, j), ca(i - 1, j - 1), ca(i, j - 1)), d);
    }
    return dp[i][j];
  }

  return ca(n - 1, m - 1);
}

// ─── Vérification sens unique ─────────────────────────────────────────────────

/**
 * Vérifie que la trace est parcourue dans le bon sens.
 *
 * Méthode : on divise la trace officielle en deux moitiés et on vérifie
 * que les timestamps de l'activité progressent de la première moitié
 * vers la seconde (pas de rebroussement global).
 */
export function checkDirection(
  activity: TrackPoint[],
  reference: GeoPoint[],
): boolean {
  if (activity.length < 4 || reference.length < 4) return true; // pas assez de données

  // Centre de la référence.
  const mid = Math.floor(reference.length / 2);
  const firstHalf = reference.slice(0, mid);
  const secondHalf = reference.slice(mid);

  // Pour chaque point de l'activité, on regarde s'il est plus proche
  // de la première ou de la seconde moitié de la référence.
  let firstCount = 0;
  let secondCount = 0;
  for (const pt of activity) {
    const dFirst = pointToPolylineM(pt, firstHalf);
    const dSecond = pointToPolylineM(pt, secondHalf);
    if (dFirst < dSecond) firstCount++;
    else secondCount++;
  }

  // Dans le bon sens : la majorité des premiers points sont côté début.
  const quarter = Math.floor(activity.length / 4);
  const startPoints = activity.slice(0, quarter);
  const endPoints = activity.slice(-quarter);

  let startNearFirst = 0;
  let endNearSecond = 0;
  for (const pt of startPoints) {
    if (pointToPolylineM(pt, firstHalf) < pointToPolylineM(pt, secondHalf))
      startNearFirst++;
  }
  for (const pt of endPoints) {
    if (pointToPolylineM(pt, secondHalf) < pointToPolylineM(pt, firstHalf))
      endNearSecond++;
  }

  void firstCount;
  void secondCount;

  return startNearFirst > quarter * 0.6 && endNearSecond > quarter * 0.6;
}

// ─── Validation complète ──────────────────────────────────────────────────────

/**
 * Valide géospatialement une activité par rapport à une trace officielle.
 *
 * @param activity       Points GPS de l'activité importée.
 * @param reference      Points GPS de la trace officielle (GPX).
 * @param corridorM      Tolérance corridor en mètres (défaut 30).
 * @param threshold      Seuil minimum de match (défaut 0.85).
 */
export function validateTrace(
  activity: GeoPoint[],
  reference: GeoPoint[],
  corridorM = 30,
  threshold = 0.85,
): MatchResult {
  // Dé-sampling pour performances.
  const actDS = downsample(activity, 500);
  const refDS = downsample(reference, 300);

  const matchScore = corridorMatchScore(actDS, refDS, corridorM);

  // Fréchet sur sous-ensemble pour détecter les raccourcis.
  const actSmall = downsample(actDS, 100);
  const refSmall = downsample(refDS, 100);
  const frechetDistanceM = discreteFrechetM(actSmall, refSmall);

  // Seuil Fréchet : la distance globale ne doit pas excéder 3 × le corridor.
  const frechetOk = frechetDistanceM <= corridorM * 3;

  const isValid = matchScore >= threshold && frechetOk;

  return {
    matchScore,
    frechetDistanceM,
    isValid,
    pointsAnalyzed: actDS.length,
  };
}
