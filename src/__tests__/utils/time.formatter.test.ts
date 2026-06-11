import { formatDuration, formatDistance, formatElevation } from '@/utils/time.formatter';

describe('formatDuration', () => {
  it('formats 3661 seconds as 1:01:01', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('formats 0 seconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats 90 seconds as 01:30', () => {
    expect(formatDuration(90)).toBe('01:30');
  });

  it('formats 7200 seconds as 2:00:00', () => {
    expect(formatDuration(7200)).toBe('2:00:00');
  });
});

describe('formatDistance', () => {
  it('formats 42.195 km as "42 km"', () => {
    expect(formatDistance(42.195)).toBe('42 km');
  });

  it('formats 5.5 km as "5.5 km"', () => {
    expect(formatDistance(5.5)).toBe('5.5 km');
  });

  it('formats 10 km without decimal', () => {
    expect(formatDistance(10)).toBe('10 km');
  });
});

describe('formatElevation', () => {
  it('formats 1234 m with + prefix', () => {
    expect(formatElevation(1234)).toBe('+1234 m');
  });

  it('formats 0 m as "+0 m"', () => {
    expect(formatElevation(0)).toBe('+0 m');
  });
});
