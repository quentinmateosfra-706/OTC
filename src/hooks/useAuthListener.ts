/**
 * Écoute l'état d'authentification Firebase et synchronise le store.
 * - Phase 3 : charge aussi le profil Firestore à la connexion.
 * - Tolérant à l'absence de config Firebase (mode démo / développement).
 */
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { isFirebaseConfigured } from '@/constants/config';
import { fetchUserProfile } from '@/services/auth.service';

export function useAuthListener(): void {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInitializing(false);
      return;
    }

    let unsubscribe = () => {};
    void (async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      const { auth } = await import('@/services/firebase');

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setFirebaseUser(user);
        if (user) {
          const profile = await fetchUserProfile(user.uid);
          setProfile(profile);
        } else {
          setProfile(null);
        }
        setInitializing(false);
      });
    })();

    return () => unsubscribe();
  }, [setFirebaseUser, setProfile, setInitializing]);
}
