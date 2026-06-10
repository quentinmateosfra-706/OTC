import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { LeaderboardEntry } from '@/components/LeaderboardEntry';
import { useGlobalLeaderboard } from '@/hooks/useGlobalLeaderboard';
import { useAuthStore } from '@/store/useAuthStore';
import { colors, spacing, radius } from '@/constants/theme';
import type { AgeBracket } from '@/types/leaderboard.types';

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

const currentYear = new Date().getFullYear();
const DEFAULT_SEASONS = [
  String(currentYear),
  String(currentYear - 1),
  String(currentYear - 2),
];

export function LeaderboardScreen() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid ?? null);
  const [gender, setGender] = useState<GenderFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const { entries, loading, error, seasons, selectedSeason, setSelectedSeason, refresh } =
    useGlobalLeaderboard({ gender, category, region: 'all' });

  const displaySeasons = seasons.length > 0 ? seasons : DEFAULT_SEASONS;

  const SkeletonRow = () => (
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonBlock, { width: 32 }]} />
      <View style={[styles.skeletonBlock, { flex: 1, marginHorizontal: spacing.sm }]} />
      <View style={[styles.skeletonBlock, { width: 72 }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.seasonRow}
      >
        {displaySeasons.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, selectedSeason === s && styles.chipActive]}
            onPress={() => setSelectedSeason(s)}
          >
            <AppText
              variant="caption"
              color={selectedSeason === s ? colors.black : colors.textSecondary}
            >
              {s}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

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
  seasonRow: {
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
