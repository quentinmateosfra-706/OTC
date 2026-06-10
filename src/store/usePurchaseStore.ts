/**
 * Store des achats et abonnements (Zustand).
 *
 * Contient :
 * - La map des courses achetées : raceId → Purchase
 * - L'abonnement actif (null si aucun)
 * - L'état de chargement initial
 *
 * La logique d'accès Firestore vit dans purchase.service.ts.
 */
import { create } from 'zustand';
import type { Purchase, Subscription } from '@/types/purchase.types';

interface PurchaseState {
  /** Map raceId → Purchase (courses achetées à l'unité). */
  purchases: Record<string, Purchase>;
  /** Abonnement actif (null si aucun ou expiré). */
  subscription: Subscription | null;
  /** Vrai pendant le chargement initial depuis Firestore. */
  loading: boolean;

  setPurchases: (purchases: Record<string, Purchase>) => void;
  addPurchase: (purchase: Purchase) => void;
  setSubscription: (sub: Subscription | null) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
  purchases: {},
  subscription: null,
  loading: true,

  setPurchases: (purchases) => set({ purchases }),
  addPurchase: (purchase) =>
    set((s) => ({ purchases: { ...s.purchases, [purchase.raceId]: purchase } })),
  setSubscription: (subscription) => set({ subscription }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ purchases: {}, subscription: null }),
}));

/** Sélecteur : l'utilisateur a-t-il accès à cette course ? */
export function useHasAccess(raceId: string, season: string): boolean {
  const purchases = usePurchaseStore((s) => s.purchases);
  const subscription = usePurchaseStore((s) => s.subscription);
  const sub = subscription;
  const hasActiveSub = sub?.status === 'active';
  const hasPurchase = !!purchases[raceId] && purchases[raceId].season === season;
  return hasActiveSub || hasPurchase;
}
