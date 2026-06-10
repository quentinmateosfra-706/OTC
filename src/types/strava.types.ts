/** Activité Strava telle que retournée par l'API (champs utiles à OTC). */
export interface StravaActivity {
  id: number;
  name: string;
  type: string; // "Run", "TrailRun", "Hike"…
  sport_type: string;
  start_date: string; // ISO 8601 UTC
  start_date_local: string;
  elapsed_time: number; // secondes
  moving_time: number; // secondes
  distance: number; // mètres
  total_elevation_gain: number; // mètres
  map: {
    summary_polyline: string; // encodage Google Polyline
  };
  manual: boolean; // activité saisie manuellement (non acceptée)
  trainer: boolean; // activité sur home-trainer (non acceptée)
}

/** Résumé affiché dans la liste de sélection (sans la polyline complète). */
export type StravaActivitySummary = Omit<StravaActivity, 'map'>;

/** Réponse de l'API Strava pour l'athlète connecté. */
export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile_medium: string; // URL avatar
}

/** Payload renvoyé par la Cloud Function `stravaExchangeToken`. */
export interface StravaTokenResult {
  athleteId: string;
  firstname: string;
  lastname: string;
}
