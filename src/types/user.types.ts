/** Rôle d'un utilisateur. */
export type UserRole = 'user' | 'admin';

/** Sexe déclaré (utilisé pour les catégories de classement). */
export type Sex = 'H' | 'F';

/** État de connexion Strava côté profil (sans aucun token). */
export interface StravaLink {
  connected: boolean;
  athleteId: string | null;
}

/** Document `users/{uid}`. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  club: string | null;
  birthDate: string | null; // ISO "AAAA-MM-JJ"
  sex: Sex | null;
  city: string | null;
  region: string | null;
  role: UserRole;
  strava: StravaLink;
  createdAt: string; // ISO
}

/** Type d'un consentement RGPD horodaté. */
export type ConsentType = 'cgu' | 'cgv' | 'privacy' | 'disclaimer';

/** Document `users/{uid}/consents/{consentId}`. */
export interface Consent {
  type: ConsentType;
  version: string; // ex. "2026-01-v1"
  acceptedAt: string; // ISO
  ipAddress: string | null; // renseigné côté Functions
}
