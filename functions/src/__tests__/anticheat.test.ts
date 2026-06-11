import { checkAntiCheat } from '../validation/anticheat';
import type { TrackPoint } from '../validation/frechet';

function makePoint(lat: number, lng: number, timeIso: string): TrackPoint {
  return { lat, lng, timeIso };
}

function makeNormalTrace(): TrackPoint[] {
  const start = new Date('2024-01-01T08:00:00Z').getTime();
  return Array.from({ length: 10 }, (_, i) => ({
    lat: 48.85 + i * 0.0003,
    lng: 2.35,
    timeIso: new Date(start + i * 60_000).toISOString(),
  }));
}

describe('checkAntiCheat', () => {
  it('passes a trace with normal walking speed', () => {
    const result = checkAntiCheat(makeNormalTrace(), false, false);
    expect(result.passed).toBe(true);
  });

  it('fails when consecutive points imply speed > 10 m/s', () => {
    const points: TrackPoint[] = [
      makePoint(48.85, 2.35, '2024-01-01T08:00:00Z'),
      makePoint(48.868, 2.35, '2024-01-01T08:00:01Z'),
    ];
    const result = checkAntiCheat(points, false, false);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/vitesse/i);
  });

  it('fails for a manual activity', () => {
    const result = checkAntiCheat(makeNormalTrace(), true, false);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/manuel/i);
  });

  it('fails for a trainer activity', () => {
    const result = checkAntiCheat(makeNormalTrace(), false, true);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/trainer|home/i);
  });

  it('fails when a pause exceeds 4 hours', () => {
    const points: TrackPoint[] = [
      makePoint(48.85, 2.35, '2024-01-01T08:00:00Z'),
      makePoint(48.85, 2.35, '2024-01-01T13:00:01Z'),
    ];
    const result = checkAntiCheat(points, false, false);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/pause/i);
  });

  it('passes with no timestamps (skips segment checks)', () => {
    const points: TrackPoint[] = [
      { lat: 48.85, lng: 2.35 },
      { lat: 48.9, lng: 2.4 },
    ];
    const result = checkAntiCheat(points, false, false);
    expect(result.passed).toBe(true);
  });
});
