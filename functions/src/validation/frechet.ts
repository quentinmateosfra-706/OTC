/**
 * Algorithme de validation géospatiale — copie de src/utils/frechet.ts.
 * Maintenu identique des deux côtés (client + Functions).
 * En production, extraire dans un package partagé (monorepo).
 */

export interface GeoPoint { lat: number; lng: number; }
export interface TrackPoint extends GeoPoint { ele?: number; timeIso?: string; }
export interface MatchResult {
  matchScore: number;
  frechetDistanceM: number;
  isValid: boolean;
  pointsAnalyzed: number;
}

const EARTH_RADIUS_M = 6_371_000;

export function haversineM(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

export function pointToSegmentM(p: GeoPoint, a: GeoPoint, b: GeoPoint): number {
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

function pointToPolylineM(p: GeoPoint, polyline: GeoPoint[]): number {
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentM(p, polyline[i], polyline[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

export function downsample<T extends GeoPoint>(pts: T[], max: number): T[] {
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => pts[Math.round(i * step)]);
}

export function corridorMatchScore(activity: GeoPoint[], reference: GeoPoint[], toleranceM: number): number {
  if (!activity.length || reference.length < 2) return 0;
  let ok = 0;
  for (const pt of activity) {
    if (pointToPolylineM(pt, reference) <= toleranceM) ok++;
  }
  return ok / activity.length;
}

export function discreteFrechetM(p: GeoPoint[], q: GeoPoint[]): number {
  const n = p.length;
  const m = q.length;
  if (!n || !m) return Infinity;
  const dp: number[][] = Array.from({ length: n }, () => new Array(m).fill(-1));
  function ca(i: number, j: number): number {
    if (dp[i][j] >= 0) return dp[i][j];
    const d = haversineM(p[i], q[j]);
    if (i === 0 && j === 0) dp[i][j] = d;
    else if (i === 0) dp[i][j] = Math.max(ca(0, j - 1), d);
    else if (j === 0) dp[i][j] = Math.max(ca(i - 1, 0), d);
    else dp[i][j] = Math.max(Math.min(ca(i - 1, j), ca(i - 1, j - 1), ca(i, j - 1)), d);
    return dp[i][j];
  }
  return ca(n - 1, m - 1);
}

export function checkDirection(activity: TrackPoint[], reference: GeoPoint[]): boolean {
  if (activity.length < 4 || reference.length < 4) return true;
  const mid = Math.floor(reference.length / 2);
  const firstHalf = reference.slice(0, mid);
  const secondHalf = reference.slice(mid);
  const quarter = Math.floor(activity.length / 4);
  const startPts = activity.slice(0, quarter);
  const endPts = activity.slice(-quarter);
  let startNearFirst = 0;
  let endNearSecond = 0;
  for (const pt of startPts) {
    if (pointToPolylineM(pt, firstHalf) < pointToPolylineM(pt, secondHalf)) startNearFirst++;
  }
  for (const pt of endPts) {
    if (pointToPolylineM(pt, secondHalf) < pointToPolylineM(pt, firstHalf)) endNearSecond++;
  }
  return startNearFirst > quarter * 0.6 && endNearSecond > quarter * 0.6;
}

export function validateTrace(
  activity: GeoPoint[], reference: GeoPoint[],
  corridorM = 30, threshold = 0.85,
): MatchResult {
  const actDS = downsample(activity, 500);
  const refDS = downsample(reference, 300);
  const matchScore = corridorMatchScore(actDS, refDS, corridorM);
  const actSmall = downsample(actDS, 100);
  const refSmall = downsample(refDS, 100);
  const frechetDistanceM = discreteFrechetM(actSmall, refSmall);
  const frechetOk = frechetDistanceM <= corridorM * 3;
  return { matchScore, frechetDistanceM, isValid: matchScore >= threshold && frechetOk, pointsAnalyzed: actDS.length };
}
