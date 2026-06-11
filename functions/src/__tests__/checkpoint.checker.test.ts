import { verifyCheckpoints } from '../validation/checkpoint.checker';
import type { GeoPoint } from '../validation/frechet';

const CP1 = { order: 1, lat: 48.850, lng: 2.350, radiusM: 50 };
const CP2 = { order: 2, lat: 48.860, lng: 2.360, radiusM: 50 };
const CP3 = { order: 3, lat: 48.870, lng: 2.370, radiusM: 50 };

function ptNear(lat: number, lng: number): GeoPoint {
  return { lat, lng };
}

const TRACE_ALL: GeoPoint[] = [
  ptNear(48.8500, 2.3500),
  ptNear(48.8550, 2.3550),
  ptNear(48.8600, 2.3600),
  ptNear(48.8650, 2.3650),
  ptNear(48.8700, 2.3700),
];

describe('verifyCheckpoints', () => {
  it('passes when all checkpoints are visited in order', () => {
    const result = verifyCheckpoints(TRACE_ALL, [CP1, CP2, CP3]);
    expect(result.passed).toBe(true);
    expect(result.checkpointsPassed).toBe(3);
    expect(result.totalCheckpoints).toBe(3);
  });

  it('fails when checkpoint 2 is skipped', () => {
    const traceSkip2: GeoPoint[] = [
      ptNear(48.8500, 2.3500),
      ptNear(48.8700, 2.3700),
    ];
    const result = verifyCheckpoints(traceSkip2, [CP1, CP2, CP3]);
    expect(result.passed).toBe(false);
    expect(result.firstFailedOrder).toBe(2);
  });

  it('fails when checkpoints are visited out of order', () => {
    const traceReversed: GeoPoint[] = [
      ptNear(48.8700, 2.3700),
      ptNear(48.8600, 2.3600),
      ptNear(48.8500, 2.3500),
    ];
    const result = verifyCheckpoints(traceReversed, [CP1, CP2, CP3]);
    expect(result.passed).toBe(false);
    expect(result.firstFailedOrder).toBe(1);
  });

  it('passes with empty checkpoints array', () => {
    const result = verifyCheckpoints(TRACE_ALL, []);
    expect(result.passed).toBe(true);
    expect(result.checkpointsPassed).toBe(0);
    expect(result.totalCheckpoints).toBe(0);
  });

  it('fails when trace is empty and checkpoints exist', () => {
    const result = verifyCheckpoints([], [CP1]);
    expect(result.passed).toBe(false);
    expect(result.firstFailedOrder).toBe(1);
  });
});
