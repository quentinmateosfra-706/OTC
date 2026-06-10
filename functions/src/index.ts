/**
 * Point d'entrée des Cloud Functions OTC.
 * Exporte toutes les functions depuis leurs modules respectifs.
 */

export { stravaExchangeToken, stravaRevoke, stravaGetActivities } from './auth/strava.oauth';
