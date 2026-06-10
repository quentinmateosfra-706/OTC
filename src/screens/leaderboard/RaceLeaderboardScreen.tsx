import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { AppText } from '@/components/ui/AppText';
import { LeaderboardEntry } from '@/components/LeaderboardEntry';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuthStore } from '@/store/useAuthStore';
import { colors, spacing, radius } from '@/constants/theme';
import type { AgeBracket } from '@/types/leaderboard.types';
import type { AppStackParamList } from '@/navigation/types';

type RouteType = RouteProp<AppStackParamList, 'RaceLeaderboard'>;

type GenderFilter = 'H' | 'F' | 'all';
type CategoryFilter = AgeBracket | 'all';

const GENDER_OPTIONS: { label: string; value: GenderFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'H', value: 'H' },
  { label: 'F', value: 'F' },
];

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Senior', value: 'Senior' },
  { label: 'V1', value: 'V1' },
  { label: 'V2', value: 'V2' },
  { label: 'V3', value: 'V3' },
];

export function RaceLeaderboardScreen() {
  const route = useRoute<RouteType>();
  const { raceId, season } = route.params;
  const uid = useAuthStore((s) => s.firebaseUser?.uid ?? null);

  const [gender, setGender] = useState<GenderFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [region, setRegion] = useState<string | 'all'>('all');
  const [raceName, setRaceName] = useState<string>('');

  const { entries, loading, error, refresh } = useLeaderboard(raceId, season, {
    gender,
    category,
    region,
  });

  useEffect(() => {
    getDoc(doc(db, 'races', raceId))
      .then((snap) => {
        if (snap.exists()) setRaceName((snap.data().title as string) ?? '');
      })
      .catch(() => {});
  }, [raceId]);

  const regions = Array.from(
    new Set(entries.map((e) => e.region).filter((r): r is string => r !== null)),
  ).sort();

  const SkeletonRow = () => (
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonBlock, { width: 32 }]} />
      <View style={[styles.skeletonBlock, { flex: 1, marginHorizontal: spacing.sm }]} />
      <View style={[styles.skeletonBlock, { width: 72 }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      {raceName !== '' && (
        <View style={styles.header}>
          <AppText variant="heading" color={colors.textPrimary}>{raceName}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>{season}</AppText>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.filterRow}
      >
        {GENDER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.chip, gender === opt.value && styles.chipActive]}
            onPress={() => setGender(opt.value)}
          >
            <AppText
              variant="caption"
              color={gender === opt.value ? colors.black : colors.textSecondary}
            >
              {opt.label}
            </AppText>
          </Pressable>
        ))}
        <View style={styles.filterSep} />
        {CATEGORY_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.chip, category === opt.value && styles.chipActive]}
            onPress={() => setCategory(opt.value)}
          >
            <AppText
              variant="caption"
              color={category === opt.value ? colors.black : colors.textSecondary}
            >
              {opt.label}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {regions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.filterRow}
        >
          <Pressable
            style={[styles.chip, region === 'all' && styles.chipActive]}
            onPress={() => setRegion('all')}
          >
            <AppText
              variant="caption"
              color={region === 'all' ? colors.black : colors.textSecondary}
            >
              Toutes régions
            </AppText>
          </Pressable>
          {regions.map((r) => (
            <Pressable
              key={r}
              style={[styles.chip, region === r && styles.chipActive]}
              onPress={() => setRegion(r)}
            >
              <AppText
                variant="caption"
                color={region === r ? colors.black : colors.textSecondary}
              >
                {r}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {error ? (
        <View style={styles.center}>
          <AppText variant="body" color={colors.danger}>{error}</AppText>
        </View>
      ) : loading ? (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="body" color={colors.textMuted}>
            Aucune performance pour ces critères
          </AppText>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.uid}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <LeaderboardEntry
              rank={item.rank}
              displayName={item.displayName}
              categoryCode={item.categoryCode}
              durationSeconds={item.durationSeconds}
              score={item.score}
              isCurrentUser={item.uid === uid}
              isNewRecord={item.isNewRecord}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterSep: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  skeletonBlock: {
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
});
