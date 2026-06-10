type Sex = 'H' | 'F';
type AgeBracket = 'Senior' | 'V1' | 'V2' | 'V3';

export function getAgeBracket(birthDateIso: string, season: string): AgeBracket {
  const refDate = new Date(`${season}-12-31`);
  const birth = new Date(birthDateIso);
  const age = refDate.getFullYear() - birth.getFullYear()
    - (refDate < new Date(birth.setFullYear(refDate.getFullYear())) ? 1 : 0);

  if (age < 40) return 'Senior';
  if (age < 50) return 'V1';
  if (age < 60) return 'V2';
  return 'V3';
}

export function getCategoryCode(sex: Sex, ageBracket: AgeBracket): string {
  if (ageBracket === 'Senior') return `S${sex}`;
  const num = ageBracket.replace('V', '');
  return `V${sex}${num}`;
}
