// Géométrie et validation des traces — partagé par les fonctions de validation OTC.

const R = 6371000; // rayon Terre (m)
const toRad = (d) => (d * Math.PI) / 180;

export function haversine(a, b) {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const la1 = toRad(lat1);
  const la2 = toRad(lat2);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Projection equirectangulaire locale autour d'un point de référence (mètres)
function project(lat, lon, lat0, lon0) {
  const x = R * toRad(lon - lon0) * Math.cos(toRad(lat0));
  const y = R * toRad(lat - lat0);
  return [x, y];
}

// Distance point → segment (mètres), via projection locale
function pointToSegmentDistance(p, a, b) {
  const [px, py] = project(p[0], p[1], p[0], p[1]);
  const [ax, ay] = project(a[0], a[1], p[0], p[1]);
  const [bx, by] = project(b[0], b[1], p[0], p[1]);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Distance minimale (m) d'un point à une polyligne
export function pointToPolylineDistance(p, line) {
  if (!line.length) return Infinity;
  if (line.length === 1) return haversine(p, line[0]);
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const d = pointToSegmentDistance(p, line[i], line[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

// % de points de l'activité à moins de thresholdM de la trace officielle
export function computeMatchPct(activityPoints, trace, thresholdM = 75) {
  if (!activityPoints.length || !trace.length) return 0;
  let ok = 0;
  for (const p of activityPoints) {
    if (pointToPolylineDistance(p, trace) <= thresholdM) ok++;
  }
  return (ok / activityPoints.length) * 100;
}

// Validation des checkpoints dans l'ordre : on cherche un passage à moins de radiusM
// de chaque checkpoint, en n'explorant que la portion d'activité postérieure au
// checkpoint précédent validé. Renvoie le nombre validé et les numéros manqués.
export function validateCheckpoints(activityPoints, checkpoints, radiusM = 100) {
  const missed = [];
  let searchFrom = 0;
  let validated = 0;
  for (const cp of checkpoints) {
    const target = [cp.lat, cp.lon];
    let found = -1;
    for (let i = searchFrom; i < activityPoints.length; i++) {
      if (haversine(activityPoints[i], target) <= radiusM) {
        found = i;
        break;
      }
    }
    if (found >= 0) {
      validated++;
      searchFrom = found + 1;
    } else {
      missed.push(cp.num);
    }
  }
  return { validated, missed };
}

export function computeDistance(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversine(points[i - 1], points[i]);
  return d;
}

// D+ lissé : ignore les variations < minStep pour filtrer le bruit du baromètre/GPS
export function computeElevationGain(alt, minStep = 3) {
  if (!alt || alt.length < 2) return 0;
  let gain = 0;
  let prev = alt[0];
  for (let i = 1; i < alt.length; i++) {
    const v = alt[i];
    const diff = v - prev;
    if (diff > minStep) {
      gain += diff;
      prev = v;
    } else if (diff < -minStep) {
      prev = v;
    }
  }
  return gain;
}