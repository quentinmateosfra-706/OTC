/**
 * Store des tentatives (Zustand).
 * Conserve la liste des tentatives du coureur (pour la bibliothèque)
 * et le résultat de la dernière validation en cours.
 */
import { create } from 'zustand';
import type { Attempt } from '@/types/attempt.types';

interface AttemptState {
  /** Tentatives de la saison courante (map attemptId → Attempt). */
  attempts: Record<string, Attempt>;
  /** ID de la tentative en cours de validation (null si aucune). */
  validatingId: string | null;

  setAttempts: (attempts: Record<string, Attempt>) => void;
  addAttempt: (attempt: Attempt) => void;
  updateAttempt: (id: string, updates: Partial<Attempt>) => void;
  setValidatingId: (id: string | null) => void;
  reset: () => void;
}

export const useAttemptStore = create<AttemptState>((set) => ({
  attempts: {},
  validatingId: null,

  setAttempts: (attempts) => set({ attempts }),
  addAttempt: (attempt) =>
    set((s) => ({ attempts: { ...s.attempts, [attempt.id]: attempt } })),
  updateAttempt: (id, updates) =>
    set((s) => ({
      attempts: {
        ...s.attempts,
        [id]: { ...s.attempts[id], ...updates },
      },
    })),
  setValidatingId: (validatingId) => set({ validatingId }),
  reset: () => set({ attempts: {}, validatingId: null }),
}));
