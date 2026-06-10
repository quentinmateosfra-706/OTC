/**
 * Hook de chargement du catalogue de courses.
 *
 * - Charge la première page au montage.
 * - `loadMore()` charge la page suivante (pagination Firestore).
 * - `refresh()` repart de zéro avec les mêmes filtres.
 * - Tolère l'absence de Firebase (retourne un tableau vide).
 */
import { useState, useEffect, useCallback } from 'react';
import type { DocumentSnapshot } from 'firebase/firestore';
import { fetchRaces, type RaceFilters } from '@/services/race.service';
import { isFirebaseConfigured } from '@/constants/config';
import type { Race } from '@/types/race.types';

interface UseRacesReturn {
  races: Race[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
}

export function useRaces(filters: RaceFilters = {}): UseRacesReturn {
  const [races, setRaces] = useState<Race[]>([]);
  const [cursor, setCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clé de rafraîchissement : incrementée par refresh().
  const [refreshKey, setRefreshKey] = useState(0);

  // Sérialise les filtres pour détecter les changements.
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(
    async (existingCursor?: DocumentSnapshot | null) => {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const { races: newRaces, nextCursor } = await fetchRaces(
          filters,
          existingCursor ?? undefined,
        );
        if (existingCursor) {
          setRaces((prev) => [...prev, ...newRaces]);
        } else {
          setRaces(newRaces);
        }
        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
        setError(null);
      } catch {
        setError('Impossible de charger les courses. Vérifie ta connexion.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey],
  );

  // Chargement initial (ou après refresh / changement de filtres).
  useEffect(() => {
    setLoading(true);
    setCursor(null);
    setRaces([]);
    load(null).finally(() => setLoading(false));
  }, [load, refreshKey]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    load(cursor).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, cursor, load]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return { races, loading, loadingMore, hasMore, error, loadMore, refresh };
}
