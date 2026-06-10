/**
 * Calcule la catégorie FFA d'un coureur selon son sexe et son âge
 * au 31 décembre de la saison en cours.
 *
 * Tranches FFA (simplifiées pour OTC) :
 * Espoir : 18-22 ans | Senior : 23-39 | V1 : 40-49 | V2 : 50-59 | V3 : 60+
 */
import type { Sex } from '@/types/user.types';
import type { AgeBracket } from '@/types/leaderboard.types';

/** Calcule la tranche d'âge FFA à partir de la date de naissance et de la saison. */
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

/** Code catégorie complet, ex. "SH", "VF1", "VH3". */
export function getCategoryCode(sex: Sex, ageBracket: AgeBracket): string {
  if (ageBracket === 'Senior') return `S${sex}`;
  const num = ageBracket.replace('V', '');
  return `V${sex}${num}`;
}
