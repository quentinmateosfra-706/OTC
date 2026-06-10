/**
 * Store d'authentification (Zustand).
 *
 * Conserve l'état de session courant : utilisateur Firebase, profil
 * coureur, et état de chargement initial. La logique d'accès Firebase
 * vit dans les services ; ce store ne fait que stocker l'état.
 */
import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/types/user.types';

interface AuthState {
  /** Utilisateur Firebase (null si déconnecté). */
  firebaseUser: FirebaseUser | null;
  /** Profil coureur Firestore (null tant que non chargé). */
  profile: UserProfile | null;
  /** Vrai pendant la résolution de l'état d'auth au démarrage. */
  initializing: boolean;
  /** Mode démo temporaire (Phase 2) : permet d'explorer l'app sans compte.
   *  Sera retiré une fois la vraie auth en place (Phase 3). */
  demoMode: boolean;

  setFirebaseUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitializing: (value: boolean) => void;
  setDemoMode: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  initializing: true,
  demoMode: false,

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (initializing) => set({ initializing }),
  setDemoMode: (demoMode) => set({ demoMode }),
  reset: () => set({ firebaseUser: null, profile: null, demoMode: false }),
}));
