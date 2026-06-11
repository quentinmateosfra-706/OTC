import { getAgeBracket, getCategoryCode } from '@/utils/category';

const SEASON = '2026';

function birthIsoForAge(age: number): string {
  return `${2026 - age}-06-15`;
}

describe('getAgeBracket', () => {
  it('returns Senior for age 34', () => {
    expect(getAgeBracket(birthIsoForAge(34), SEASON)).toBe('Senior');
  });

  it('returns V1 for age 42', () => {
    expect(getAgeBracket(birthIsoForAge(42), SEASON)).toBe('V1');
  });

  it('returns V2 for age 52', () => {
    expect(getAgeBracket(birthIsoForAge(52), SEASON)).toBe('V2');
  });

  it('returns V3 for age 62', () => {
    expect(getAgeBracket(birthIsoForAge(62), SEASON)).toBe('V3');
  });
});

describe('getCategoryCode', () => {
  it('returns SH for male Senior', () => {
    expect(getCategoryCode('H', 'Senior')).toBe('SH');
  });

  it('returns SF for female Senior', () => {
    expect(getCategoryCode('F', 'Senior')).toBe('SF');
  });

  it('returns VF1 for female V1', () => {
    expect(getCategoryCode('F', 'V1')).toBe('VF1');
  });

  it('returns VH3 for male V3', () => {
    expect(getCategoryCode('H', 'V3')).toBe('VH3');
  });
});
