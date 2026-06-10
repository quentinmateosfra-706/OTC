/** Un palier tarifaire : prix unitaire jusqu'à `maxKm` (null = au-delà). */
export interface PricingTier {
  maxKm: number | null;
  priceEur: number;
}

/** Grille tarifaire complète (document `pricing/current`). */
export interface Pricing {
  tiers: PricingTier[];
  passes: {
    monthly: number;
    annual: number;
  };
  defaultOrganizerPayoutPct: number;
}
