/**
 * Écoute l'état d'authentification Firebase et synchronise le store.
 *
 * En Phase 2, la config Firebase peut être absente : on bascule alors
 * `initializing` à false sans planter, pour afficher l'AuthStack.
 * La récupération du profil Firestore sera ajoutée en Phase 3.
 */
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { isFirebaseConfigured } from '@/constants/config';

export function useAuthListener(): void {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    // Sans config Firebase, on ne tente pas de s'abonner à l'auth.
    if (!isFirebaseConfigured) {
      setInitializing(false);
      return;
    }

    let unsubscribe = () => {};
    // Import dynamique : évite d'initialiser Firebase si non configuré.
    void (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { auth } = await import('@/services/firebase');
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setInitializing(false);
      });
    })();

    return () => unsubscribe();
  }, [setFirebaseUser, setInitializing]);
}
