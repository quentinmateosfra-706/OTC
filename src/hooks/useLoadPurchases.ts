/**
 * Charge les achats et l'abonnement de l'utilisateur connecté.
 * Appelé une fois après le login, synchronise le store Zustand.
 */
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { fetchUserPurchases, fetchSubscription } from '@/services/purchase.service';
import { isFirebaseConfigured } from '@/constants/config';

const CURRENT_SEASON = '2026';

export function useLoadPurchases(): void {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setPurchases = usePurchaseStore((s) => s.setPurchases);
  const setSubscription = usePurchaseStore((s) => s.setSubscription);
  const setLoading = usePurchaseStore((s) => s.setLoading);

  useEffect(() => {
    if (!firebaseUser || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const uid = firebaseUser.uid;
    setLoading(true);

    void Promise.all([
      fetchUserPurchases(uid, CURRENT_SEASON),
      fetchSubscription(uid),
    ])
      .then(([purchases, subscription]) => {
        const map: ReturnType<typeof usePurchaseStore.getState>['purchases'] = {};
        purchases.forEach((p) => { map[p.raceId] = p; });
        setPurchases(map);
        setSubscription(subscription);
      })
      .finally(() => setLoading(false));
  }, [firebaseUser, setPurchases, setSubscription, setLoading]);
}
