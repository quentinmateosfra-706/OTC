/**
 * Service de lecture de la grille tarifaire Firestore.
 * Retourne toujours quelque chose : données Firestore si disponibles,
 * sinon PRICING_FALLBACK (grille locale).
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PRICING_FALLBACK, priceForDistance } from '@/constants/pricing.fallback';
import type { Pricing } from '@/types/pricing.types';

/** Récupère la grille tarifaire courante (avec repli local). */
export async function fetchPricing(): Promise<Pricing> {
  try {
    const snap = await getDoc(doc(db, 'pricing', 'current'));
    if (snap.exists()) return snap.data() as Pricing;
  } catch {
    // Pas de réseau ou Firestore non configuré → repli silencieux.
  }
  return PRICING_FALLBACK;
}

export { priceForDistance };
