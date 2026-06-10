import type { Sex } from './user.types';

/** Tranche d'âge utilisée pour les catégories de classement. */
export type AgeBracket = 'Senior' | 'V1' | 'V2' | 'V3';

/** Entrée de classement `leaderboard/{raceId_season}/entries/{userId}`. */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  club: string | null;
  bestTimeSeconds: number;
  category: string; // ex. "SH", "VF1"…
  sex: Sex;
  ageBracket: AgeBracket;
  region: string | null;
  rank: number;
}

/** Document `leaderboard/{raceId_season}`. */
export interface Leaderboard {
  raceId: string;
  season: string;
  frozenAt: string | null; // ISO — figé à endDate
}
