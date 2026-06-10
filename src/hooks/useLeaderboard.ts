import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { AgeBracket } from '@/types/leaderboard.types';

export interface LeaderboardEntryDisplay {
  uid: string;
  displayName: string;
  gender: 'H' | 'F';
  categoryCode: string;
  category: AgeBracket;
  region: string | null;
  durationSeconds: number;
  score: number;
  rank: number;
  validatedAt: Date;
  isNewRecord: boolean;
}

interface Filters {
  gender: 'H' | 'F' | 'all';
  category: AgeBracket | 'all';
  region: string | 'all';
}

interface UseLeaderboardResult {
  entries: LeaderboardEntryDisplay[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLeaderboard(
  raceId: string,
  season: string,
  filters: Filters,
): UseLeaderboardResult {
  const [allEntries, setAllEntries] = useState<LeaderboardEntryDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, `leaderboard/${raceId}_${season}/entries`);
    const q = query(colRef, orderBy('rank', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const entries: LeaderboardEntryDisplay[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            uid: doc.id,
            displayName: d.displayName as string,
            gender: d.gender as 'H' | 'F',
            categoryCode: d.categoryCode as string,
            category: d.category as AgeBracket,
            region: (d.region as string | null) ?? null,
            durationSeconds: d.durationSeconds as number,
            score: d.score as number,
            rank: d.rank as number,
            validatedAt: (d.validatedAt as { toDate(): Date }).toDate(),
            isNewRecord: (d.isNewRecord as boolean) ?? false,
          };
        });
        setAllEntries(entries);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [raceId, season, tick]);

  const entries = allEntries.filter((e) => {
    if (filters.gender !== 'all' && e.gender !== filters.gender) return false;
    if (filters.category !== 'all' && e.category !== filters.category) return false;
    if (filters.region !== 'all' && e.region !== filters.region) return false;
    return true;
  });

  return { entries, loading, error, refresh };
}
