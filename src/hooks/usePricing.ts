/** Charge la grille tarifaire (Firestore ou fallback local). */
import { useState, useEffect } from 'react';
import { fetchPricing, priceForDistance } from '@/services/pricing.service';
import { PRICING_FALLBACK } from '@/constants/pricing.fallback';
import type { Pricing } from '@/types/pricing.types';

interface UsePricingReturn {
  pricing: Pricing;
  priceFor: (distanceKm: number) => number;
  loading: boolean;
}

export function usePricing(): UsePricingReturn {
  const [pricing, setPricing] = useState<Pricing>(PRICING_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricing()
      .then(setPricing)
      .finally(() => setLoading(false));
  }, []);

  return {
    pricing,
    priceFor: (km) => priceForDistance(km, pricing),
    loading,
  };
}
