/**
 * Catalogue des courses OTC.
 *
 * Filtres : région (liste déroulante), distance (catégories), saison.
 * Liste paginée avec RaceCard. Prix affiché dynamiquement.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { RaceCard } from '@/components/RaceCard';
import { colors, spacing, radius } from '@/constants/theme';
import { useRaces } from '@/hooks/useRaces';
import { usePricing } from '@/hooks/usePricing';
import { isFirebaseConfigured } from '@/constants/config';
import type { AppStackParamList } from '@/navigation/types';
import type { RaceFilters } from '@/services/race.service';

type Nav = NativeStackNavigationProp<AppStackParamList>;

// Filtres de distance prédéfinis.
const DISTANCE_FILTERS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Toutes' },
  { label: '< 15 km', max: 15 },
  { label: '15–30 km', min: 15, max: 30 },
  { label: '30–50 km', min: 30, max: 50 },
  { label: '50–80 km', min: 50, max: 80 },
  { label: '80+ km', min: 80 },
];

const CURRENT_SEASON = '2026';

export function CatalogScreen() {
  const navigation = useNavigation<Nav>();
  const { priceFor } = usePricing();

  const [distanceIdx, setDistanceIdx] = useState(0);

  const distFilter = DISTANCE_FILTERS[distanceIdx];
  const filters: RaceFilters = {
    season: CURRENT_SEASON,
    minDistanceKm: distFilter.min,
    maxDistanceKm: distFilter.max,
  };

  const { races, loading, loadingMore, hasMore, error, loadMore, refresh } =
    useRaces(filters);

  const handleRacePress = useCallback(
    (raceId: string) => navigation.navigate('RaceDetail', { raceId }),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* En-tête fixe avec filtres */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="title">Catalogue</AppText>
          <AppText variant="caption" color={colors.accent}>
            SAISON {CURRENT_SEASON}
          </AppText>
        </View>

        {/* Filtres distance — chips horizontaux */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {DISTANCE_FILTERS.map((f, i) => (
            <Pressable
              key={i}
              style={[styles.chip, distanceIdx === i && styles.chipActive]}
              onPress={() => setDistanceIdx(i)}
            >
              <AppText
                variant="caption"
                color={distanceIdx === i ? colors.black : colors.textSecondary}
              >
                {f.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Pas de Firebase configuré */}
      {!isFirebaseConfigured && (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.accent} />
          <AppText variant="heading" style={styles.emptyTitle}>
            Mode démo
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
            Configure Firebase dans ton fichier .env pour afficher les courses.
          </AppText>
        </View>
      )}

      {/* Erreur */}
      {error && (
        <View style={styles.emptyState}>
          <Ionicons name="warning-outline" size={48} color={colors.danger} />
          <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
            {error}
          </AppText>
        </View>
      )}

      {/* Liste */}
      {isFirebaseConfigured && !error && (
        <FlatList
          data={races}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.accent}
            />
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyState}>
                <Ionicons name="trail-sign-outline" size={48} color={colors.textMuted} />
                <AppText
                  variant="body"
                  color={colors.textSecondary}
                  style={styles.emptyText}
                >
                  Aucune course disponible pour ces critères.
                </AppText>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.accent}
                style={{ marginVertical: spacing.lg }}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <RaceCard
              race={item}
              price={priceFor(item.distanceKm)}
              onPress={() => handleRacePress(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
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
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: { marginTop: spacing.xs },
  emptyText: { textAlign: 'center' },
});
