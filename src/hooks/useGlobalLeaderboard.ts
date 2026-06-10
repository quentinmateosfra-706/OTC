import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { AgeBracket } from '@/types/leaderboard.types';

export interface GlobalLeaderboardEntry {
  uid: string;
  displayName: string;
  gender: 'H' | 'F';
  categoryCode: string;
  category: AgeBracket;
  region: string | null;
  durationSeconds: number;
  score: number;
  rank: number;
  raceId: string;
  raceName: string;
  isNewRecord: boolean;
}

interface Filters {
  gender: 'H' | 'F' | 'all';
  category: AgeBracket | 'all';
  region: string | 'all';
}

interface UseGlobalLeaderboardResult {
  entries: GlobalLeaderboardEntry[];
  loading: boolean;
  error: string | null;
  seasons: string[];
  selectedSeason: string;
  setSelectedSeason: (s: string) => void;
  refresh: () => void;
}

const currentYear = new Date().getFullYear().toString();

export function useGlobalLeaderboard(filters: Filters): UseGlobalLeaderboardResult {
  const [allEntries, setAllEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<string[]>([currentYear]);
  const [selectedSeason, setSelectedSeason] = useState(currentYear);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    getDoc(doc(db, 'leaderboard_global', 'meta'))
      .then((snap) => {
        if (snap.exists()) {
          const s = (snap.data().seasons as string[]) ?? [];
          if (s.length > 0) setSeasons(s);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const colRef = collection(db, `leaderboard_global/${selectedSeason}/entries`);
    const q = query(colRef, orderBy('score', 'desc'), limit(100));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const entries: GlobalLeaderboardEntry[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            displayName: data.displayName as string,
            gender: data.gender as 'H' | 'F',
            categoryCode: data.categoryCode as string,
            category: data.category as AgeBracket,
            region: (data.region as string | null) ?? null,
            durationSeconds: data.durationSeconds as number,
            score: data.score as number,
            rank: data.rank as number,
            raceId: data.raceId as string,
            raceName: data.raceName as string,
            isNewRecord: (data.isNewRecord as boolean) ?? false,
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
  }, [selectedSeason, tick]);

  const entries = allEntries.filter((e) => {
    if (filters.gender !== 'all' && e.gender !== filters.gender) return false;
    if (filters.category !== 'all' && e.category !== filters.category) return false;
    if (filters.region !== 'all' && e.region !== filters.region) return false;
    return true;
  });

  return { entries, loading, error, seasons, selectedSeason, setSelectedSeason, refresh };
}
