/**
 * Grille tarifaire de repli (fallback) utilisée si Firestore est
 * injoignable. La source de vérité reste le document `pricing/current`
 * en base, éditable depuis l'admin sans redéploiement.
 *
 * Prix exprimés en euros (nombre décimal), comme en base.
 */
import type { Pricing } from '@/types/pricing.types';

export const PRICING_FALLBACK: Pricing = {
  tiers: [
    { maxKm: 15, priceEur: 4.99 }, // < 15 km — découverte
    { maxKm: 30, priceEur: 7.99 }, // 15–30 km — court
    { maxKm: 50, priceEur: 12.99 }, // 30–50 km — moyen
    { maxKm: 80, priceEur: 19.99 }, // 50–80 km — long
    { maxKm: null, priceEur: 29.99 }, // 80+ km — ultra
  ],
  passes: {
    monthly: 17.99,
    annual: 179.0,
  },
  defaultOrganizerPayoutPct: 0.3,
};

/** Renvoie le prix unitaire €  correspondant à une distance (km). */
export function priceForDistance(distanceKm: number, pricing: Pricing): number {
  for (const tier of pricing.tiers) {
    if (tier.maxKm === null || distanceKm < tier.maxKm) {
      return tier.priceEur;
    }
  }
  // Sécurité : si aucun palier ne matche, on prend le dernier.
  return pricing.tiers[pricing.tiers.length - 1].priceEur;
}
