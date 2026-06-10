/** Un checkpoint virtuel sur le parcours (validation dans l'ordre). */
export interface Checkpoint {
  order: number;
  lat: number;
  lng: number;
  radiusM: number;
}

/** Un point du profil altimétrique échantillonné (affichage). */
export interface ElevationPoint {
  distanceM: number;
  elevationM: number;
}

/** Paramètres de validation, ajustables course par course. */
export interface RaceValidation {
  corridorToleranceM: number; // ex. 30
  matchThreshold: number; // ex. 0.85
  minCheckpointPassRate: number; // ex. 1.0 (100 %)
}

/** Statut d'une édition de course. */
export type RaceStatus = 'draft' | 'active' | 'archived';

/** Document `races/{raceId}` — une édition annuelle. */
export interface Race {
  id: string;
  name: string;
  region: string;
  distanceKm: number;
  elevationGainM: number;
  officialEventDate: string; // ISO
  season: string; // ex. "2026"
  startDate: string; // ISO — ouverture de la fenêtre de tentative
  endDate: string; // ISO — fermeture
  status: RaceStatus;
  gpxStoragePath: string;
  description: string;
  elevationProfile: ElevationPoint[];
  checkpoints: Checkpoint[];
  priceTierId: string;
  organizerId: string;
  organizerPayout: number; // montant fixe en centimes
  validation: RaceValidation;
}
