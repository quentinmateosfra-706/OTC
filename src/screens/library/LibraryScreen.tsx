/**
 * Bibliothèque du coureur — liste des courses achetées pour la saison.
 *
 * Pour chaque course achetée :
 * - Affiche la course (RaceCard).
 * - Bouton « Lancer une tentative » → SafetyBriefing (Phase 7).
 * - Badge « Meilleur temps » si une tentative validée existe.
 *
 * Si l'utilisateur a un abonnement actif, un bandeau le signale.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { RaceCard } from '@/components/RaceCard';
import { colors, spacing, radius } from '@/constants/theme';
import { usePurchaseStore } from '@/store/usePurchaseStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchRaceById } from '@/services/race.service';
import { fetchUserPurchases } from '@/services/purchase.service';
import { isFirebaseConfigured } from '@/constants/config';
import { usePricing } from '@/hooks/usePricing';
import type { AppStackParamList } from '@/navigation/types';
import type { Race } from '@/types/race.types';

type Nav = NativeStackNavigationProp<AppStackParamList>;
const CURRENT_SEASON = '2026';

interface LibraryEntry {
  race: Race;
  purchasedAt: string;
}

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const purchases = usePurchaseStore((s) => s.purchases);
  const subscription = usePurchaseStore((s) => s.subscription);
  const purchaseLoading = usePurchaseStore((s) => s.loading);
  const { priceFor } = usePricing();

  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadEntries() {
    if (!firebaseUser || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const userPurchases = await fetchUserPurchases(firebaseUser.uid, CURRENT_SEASON);
      const raceDetails = await Promise.all(
        userPurchases.map((p) => fetchRaceById(p.raceId)),
      );
      const valid: LibraryEntry[] = userPurchases
        .map((p, i) => ({ purchase: p, race: raceDetails[i] }))
        .filter((x): x is { purchase: typeof userPurchases[0]; race: Race } => x.race !== null)
        .map(({ purchase, race }) => ({
          race,
          purchasedAt: purchase.purchasedAt,
        }));
      setEntries(valid);
    } catch {
      // Silencieux — état vide affiché.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, purchases]);

  function handleRefresh() {
    setRefreshing(true);
    loadEntries();
  }

  const isLoading = loading || purchaseLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Bandeau abonnement actif */}
      {subscription?.status === 'active' && (
        <View style={styles.subBanner}>
          <Ionicons name="infinite-outline" size={16} color={colors.black} />
          <AppText variant="caption" color={colors.black}>
            Pass illimité actif · toutes les courses disponibles
          </AppText>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.race.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="title">Ma bibliothèque</AppText>
              <AppText variant="caption" color={colors.accent}>
                SAISON {CURRENT_SEASON}
              </AppText>
            </View>
          }
          ListEmptyComponent={<EmptyState navigation={navigation} firebaseUser={firebaseUser} />}
          renderItem={({ item }) => (
            <View style={styles.entryWrapper}>
              <RaceCard
                race={item.race}
                price={priceFor(item.race.distanceKm)}
                onPress={() => navigation.navigate('RaceDetail', { raceId: item.race.id })}
              />
              <Button
                label="Lancer une tentative"
                onPress={() => navigation.navigate('SafetyBriefing', { raceId: item.race.id })}
                style={styles.attemptBtn}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState({
  navigation,
  firebaseUser,
}: {
  navigation: Nav;
  firebaseUser: ReturnType<typeof useAuthStore>['firebaseUser'] | null;
}) {
  if (!isFirebaseConfigured || !firebaseUser) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.accent} />
        <AppText variant="heading" style={styles.emptyTitle}>Mode démo</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
          Configure Firebase pour voir ta bibliothèque.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={48} color={colors.textMuted} />
      <AppText variant="heading" style={styles.emptyTitle}>
        Aucune course achetée
      </AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
        Explore le catalogue et achète ta première course pour la saison {CURRENT_SEASON}.
      </AppText>
      <Button
        label="Voir le catalogue"
        onPress={() => navigation.navigate('Tabs', { screen: 'Catalog' })}
        style={styles.emptyBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  subBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  entryWrapper: { gap: spacing.sm },
  attemptBtn: { borderRadius: radius.md },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { marginTop: spacing.xs },
  emptyText: { textAlign: 'center' },
  emptyBtn: { marginTop: spacing.sm, alignSelf: 'stretch' },
});
