// Strava n'accepte qu'un seul « Authorization Callback Domain » : on renvoie
// toujours vers le domaine publié, même si l'app est ouverte ailleurs
// (application Base44, preview…).
export const STRAVA_APP_ORIGIN = "https://off-trail-challenge.base44.app";

export const stravaRedirect = (path) => STRAVA_APP_ORIGIN + path;
