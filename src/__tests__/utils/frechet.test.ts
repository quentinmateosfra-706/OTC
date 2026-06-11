import {
  haversineM,
  corridorMatchScore,
  discreteFrechetM,
  checkDirection,
  validateTrace,
} from '@/utils/frechet';
import type { GeoPoint, TrackPoint } from '@/utils/frechet';

const BASE_LAT = 48.85;
const BASE_LNG = 2.35;

function makeLine(n = 10, latStart = BASE_LAT, lngStart = BASE_LNG, lngStep = 0.001): GeoPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    lat: latStart,
    lng: lngStart + i * lngStep,
  }));
}

function makeLineWithTime(
  n = 10,
  latStart = BASE_LAT,
  lngStart = BASE_LNG,
  lngStep = 0.001,
  startMs = 0,
  stepMs = 60_000,
): TrackPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    lat: latStart,
    lng: lngStart + i * lngStep,
    timeIso: new Date(startMs + i * stepMs).toISOString(),
  }));
}

describe('haversineM', () => {
  it('returns 0 for identical points', () => {
    const p: GeoPoint = { lat: BASE_LAT, lng: BASE_LNG };
    expect(haversineM(p, p)).toBe(0);
  });

  it('returns roughly 392 km between Paris and Lyon', () => {
    const paris: GeoPoint = { lat: 48.8566, lng: 2.3522 };
    const lyon: GeoPoint = { lat: 45.7640, lng: 4.8357 };
    const d = haversineM(paris, lyon);
    expect(d).toBeGreaterThan(392_000 * 0.95);
    expect(d).toBeLessThan(392_000 * 1.05);
  });
});

describe('corridorMatchScore', () => {
  it('returns >= 0.99 when trace exactly follows reference', () => {
    const ref = makeLine(10);
    const trace = makeLine(10);
    expect(corridorMatchScore(trace, ref, 30)).toBeGreaterThanOrEqual(0.99);
  });

  it('returns < 0.1 when trace is far from reference', () => {
    const ref = makeLine(10, BASE_LAT, BASE_LNG);
    const farTrace = makeLine(10, BASE_LAT + 10, BASE_LNG + 10);
    expect(corridorMatchScore(farTrace, ref, 30)).toBeLessThan(0.1);
  });

  it('returns 0 for empty activity', () => {
    const ref = makeLine(10);
    expect(corridorMatchScore([], ref, 30)).toBe(0);
  });
});

describe('discreteFrechetM', () => {
  it('returns 0 for identical traces', () => {
    const trace = makeLine(5);
    expect(discreteFrechetM(trace, trace)).toBe(0);
  });

  it('returns ~100m for traces offset by ~0.001 deg lat (~111m)', () => {
    const a = makeLine(5, BASE_LAT, BASE_LNG);
    const b = makeLine(5, BASE_LAT + 0.001, BASE_LNG);
    const d = discreteFrechetM(a, b);
    expect(d).toBeGreaterThan(50);
    expect(d).toBeLessThan(200);
  });

  it('returns Infinity for empty input', () => {
    expect(discreteFrechetM([], makeLine(5))).toBe(Infinity);
  });
});

describe('checkDirection', () => {
  it('returns true for a trace in the same direction as reference', () => {
    const ref = makeLine(20, BASE_LAT, BASE_LNG, 0.001);
    const trace = makeLineWithTime(20, BASE_LAT, BASE_LNG, 0.001);
    expect(checkDirection(trace, ref)).toBe(true);
  });

  it('returns false for a reversed trace', () => {
    const ref = makeLine(20, BASE_LAT, BASE_LNG, 0.001);
    const forwardPts = makeLineWithTime(20, BASE_LAT, BASE_LNG, 0.001);
    const reversed = [...forwardPts].reverse().map((p, i) => ({
      ...p,
      timeIso: new Date(i * 60_000).toISOString(),
    })) as TrackPoint[];
    expect(checkDirection(reversed, ref)).toBe(false);
  });
});

describe('validateTrace', () => {
  it('returns isValid=true for a trace matching the reference', () => {
    const ref = makeLine(50, BASE_LAT, BASE_LNG, 0.001);
    const trace = makeLine(50, BASE_LAT, BASE_LNG, 0.001);
    const result = validateTrace(trace, ref, 30, 0.85);
    expect(result.isValid).toBe(true);
    expect(result.matchScore).toBeGreaterThanOrEqual(0.85);
  });

  it('returns isValid=false for a trace far from reference', () => {
    const ref = makeLine(50, BASE_LAT, BASE_LNG, 0.001);
    const farTrace = makeLine(50, BASE_LAT + 10, BASE_LNG + 10, 0.001);
    const result = validateTrace(farTrace, ref, 30, 0.85);
    expect(result.isValid).toBe(false);
  });
});
