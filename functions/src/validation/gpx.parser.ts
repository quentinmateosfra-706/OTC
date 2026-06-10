/** Parseur GPX léger pour les Cloud Functions (copie de src/utils/gpx.parser.ts). */
import type { TrackPoint } from './frechet';

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`${name}="([^"]*)"`, 'i').exec(tag);
  return m ? m[1] : null;
}

function inner(xml: string, tag: string): string | null {
  const m = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i').exec(xml);
  return m ? m[1].trim() : null;
}

export function parseGpx(gpxString: string): TrackPoint[] {
  const points: TrackPoint[] = [];
  const trkptRegex = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(gpxString)) !== null) {
    const lat = parseFloat(attr(match[1], 'lat') ?? '');
    const lng = parseFloat(attr(match[1], 'lon') ?? '');
    if (isNaN(lat) || isNaN(lng)) continue;
    const eleStr = inner(match[2], 'ele');
    const timeStr = inner(match[2], 'time');
    points.push({ lat, lng, ele: eleStr ? parseFloat(eleStr) : undefined, timeIso: timeStr ?? undefined });
  }
  return points;
}

export function traceDurationSeconds(points: TrackPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].timeIso;
  const last = points[points.length - 1].timeIso;
  if (!first || !last) return null;
  return Math.round((new Date(last).getTime() - new Date(first).getTime()) / 1000);
}
