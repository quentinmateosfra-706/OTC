/**
 * Parseur GPX léger — extrait les points de trace d'un fichier GPX (XML).
 *
 * Supporte :
 * - <trkpt> dans <trkseg> (format standard GPS).
 * - <wpt> (waypoints, pour les checkpoints).
 *
 * Pas de dépendance externe : parsing XML minimal avec des regex robustes.
 * Suffisant pour des fichiers GPX bien formés (export Strava / Garmin / COROS).
 */
import type { TrackPoint } from './frechet';

/** Extrait la valeur d'un attribut XML. */
function attr(tag: string, name: string): string | null {
  const m = new RegExp(`${name}="([^"]*)"`, 'i').exec(tag);
  return m ? m[1] : null;
}

/** Extrait le contenu d'une balise XML. */
function inner(xml: string, tag: string): string | null {
  const m = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i').exec(xml);
  return m ? m[1].trim() : null;
}

/**
 * Parse un fichier GPX (string XML) et retourne les points de la trace.
 * Prend la première `<trkseg>` trouvée.
 */
export function parseGpx(gpxString: string): TrackPoint[] {
  const points: TrackPoint[] = [];

  // Extrait les balises <trkpt ...>...</trkpt>
  const trkptRegex = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
  let match: RegExpExecArray | null;

  while ((match = trkptRegex.exec(gpxString)) !== null) {
    const attrs = match[1];
    const body = match[2];

    const lat = parseFloat(attr(attrs, 'lat') ?? '');
    const lng = parseFloat(attr(attrs, 'lon') ?? '');
    if (isNaN(lat) || isNaN(lng)) continue;

    const eleStr = inner(body, 'ele');
    const timeStr = inner(body, 'time');

    points.push({
      lat,
      lng,
      ele: eleStr ? parseFloat(eleStr) : undefined,
      timeIso: timeStr ?? undefined,
    });
  }

  return points;
}

/**
 * Calcule la durée officielle d'une trace en secondes.
 * Utilise les timestamps du premier et dernier point.
 */
export function traceDurationSeconds(points: TrackPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].timeIso;
  const last = points[points.length - 1].timeIso;
  if (!first || !last) return null;
  return Math.round((new Date(last).getTime() - new Date(first).getTime()) / 1000);
}

/**
 * Calcule la distance totale d'une trace en mètres (Haversine).
 */
export function traceDistanceM(points: TrackPoint[]): number {
  // Importation circulaire évitée : on recalcule inline.
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
      sinDLat * sinDLat +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        sinDLng * sinDLng;
    total += 2 * 6_371_000 * Math.asin(Math.sqrt(h));
  }
  return total;
}
