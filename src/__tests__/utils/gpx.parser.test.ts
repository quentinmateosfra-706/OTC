import { parseGpx, traceDistanceM } from '@/utils/gpx.parser';
import type { TrackPoint } from '@/utils/frechet';

const MINIMAL_GPX = `<?xml version="1.0"?>
<gpx>
  <trk><trkseg>
    <trkpt lat="48.85" lon="2.35">
      <ele>100</ele>
      <time>2024-01-01T08:00:00Z</time>
    </trkpt>
    <trkpt lat="48.851" lon="2.351">
      <ele>102</ele>
      <time>2024-01-01T08:05:00Z</time>
    </trkpt>
    <trkpt lat="48.852" lon="2.352">
      <ele>105</ele>
      <time>2024-01-01T08:10:00Z</time>
    </trkpt>
  </trkseg></trk>
</gpx>`;

describe('parseGpx', () => {
  it('parses 3 trkpt elements', () => {
    const pts = parseGpx(MINIMAL_GPX);
    expect(pts).toHaveLength(3);
  });

  it('extracts lat/lng correctly', () => {
    const pts = parseGpx(MINIMAL_GPX);
    expect(pts[0].lat).toBeCloseTo(48.85, 4);
    expect(pts[0].lng).toBeCloseTo(2.35, 4);
  });

  it('extracts ele and timeIso', () => {
    const pts = parseGpx(MINIMAL_GPX);
    expect(pts[0].ele).toBe(100);
    expect(pts[0].timeIso).toBe('2024-01-01T08:00:00Z');
  });

  it('returns [] for empty string', () => {
    expect(parseGpx('')).toEqual([]);
  });

  it('returns [] for gpx with no trkpt', () => {
    expect(parseGpx('<gpx></gpx>')).toEqual([]);
  });
});

describe('traceDistanceM', () => {
  it('returns 0 for a single point', () => {
    const pts: TrackPoint[] = [{ lat: 48.85, lng: 2.35 }];
    expect(traceDistanceM(pts)).toBe(0);
  });

  it('returns 0 for two identical points', () => {
    const pts: TrackPoint[] = [
      { lat: 48.85, lng: 2.35 },
      { lat: 48.85, lng: 2.35 },
    ];
    expect(traceDistanceM(pts)).toBe(0);
  });

  it('returns ~1km for two points approximately 1km apart', () => {
    const pts: TrackPoint[] = [
      { lat: 48.85, lng: 2.35 },
      { lat: 48.859, lng: 2.35 },
    ];
    const d = traceDistanceM(pts);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1100);
  });
});
