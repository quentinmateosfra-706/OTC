/**
 * Fiche course complète.
 *
 * Sections :
 * 1. En-tête (nom, région, stats, badge statut)
 * 2. Carte Mapbox avec la trace jaune Frontale
 * 3. Profil altimétrique SVG
 * 4. Description éditoriale
 * 5. Checkpoints virtuels
 * 6. Fenêtre de tentative
 * 7. Prix + CTA achat (Phase 6) / accès à la bibliothèque
 */
import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ElevationChart } from '@/components/ElevationChart';
import { MapboxTraceView } from '@/components/MapboxTraceView';
import { colors, spacing, radius } from '@/constants/theme';
import { fetchRaceById } from '@/services/race.service';
import { usePricing } from '@/hooks/usePricing';
import { useHasAccess } from '@/store/usePurchaseStore';
import {
  formatDistance,
  formatElevation,
  formatDate,
} from '@/utils/time.formatter';
import type { AppStackParamList } from '@/navigation/types';
import type { Race } from '@/types/race.types';

type Props = NativeStackScreenProps<AppStackParamList, 'RaceDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

export function RaceDetailScreen() {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Nav>();
  const { raceId } = route.params;
  const { width } = useWindowDimensions();
  const { priceFor } = usePricing();

  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useLayoutEffect(() => {
    if (race) {
      navigation.setOptions({ title: race.name });
    }
  }, [race, navigation]);

  useEffect(() => {
    fetchRaceById(raceId)
      .then((r) => {
        if (!r) setError(true);
        else setRace(r);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [raceId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error || !race) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color={colors.danger} />
        <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
          Course introuvable.
        </AppText>
      </View>
    );
  }

  const price = priceFor(race.distanceKm);
  const isOpen = race.status === 'active';
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const hasAccess = useHasAccess(race.id, race.season);

  // Coordonnées pour Mapbox : on génère depuis les checkpoints si pas de GPX parsé.
  // (Le GPX complet sera parsé à l'import d'activité — Phase 7.)
  const mapCoords: [number, number][] =
    race.checkpoints.length >= 2
      ? race.checkpoints.map((cp) => [cp.lng, cp.lat])
      : [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Carte Mapbox ─────────────────────────────── */}
        <MapboxTraceView
          coordinates={mapCoords}
          height={220}
          checkpoints={race.checkpoints}
        />

        {/* ── En-tête ──────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <AppText variant="caption" color={colors.accent}>
              {race.region.toUpperCase()} · SAISON {race.season}
            </AppText>
            <View style={[styles.badge, isOpen ? styles.badgeOpen : styles.badgeArch]}>
              <AppText variant="caption" color={isOpen ? colors.black : colors.textMuted}>
                {isOpen ? 'OUVERT' : 'ARCHIVÉ'}
              </AppText>
            </View>
          </View>
          <AppText variant="display">{race.name}</AppText>

          {/* Stats clés */}
          <View style={styles.statsRow}>
            <StatCard
              icon="navigate-outline"
              value={formatDistance(race.distanceKm)}
              label="Distance"
            />
            <StatCard
              icon="trending-up-outline"
              value={formatElevation(race.elevationGainM)}
              label="Dénivelé"
            />
            <StatCard
              icon="calendar-outline"
              value={formatDate(race.officialEventDate)}
              label="Épreuve officielle"
            />
          </View>
        </View>

        {/* ── Profil altimétrique ───────────────────────── */}
        {race.elevationProfile.length >= 2 && (
          <Section title="PROFIL ALTIMÉTRIQUE">
            <ElevationChart
              data={race.elevationProfile}
              width={width - spacing.lg * 2}
            />
          </Section>
        )}

        {/* ── Description ──────────────────────────────── */}
        {race.description ? (
          <Section title="À PROPOS">
            <AppText variant="body" color={colors.textSecondary}>
              {race.description}
            </AppText>
          </Section>
        ) : null}

        {/* ── Checkpoints ──────────────────────────────── */}
        {race.checkpoints.length > 0 && (
          <Section title={`CHECKPOINTS VIRTUELS (${race.checkpoints.length})`}>
            <AppText variant="caption" color={colors.textMuted} style={styles.cpNote}>
              Chaque checkpoint doit être franchi dans l'ordre. Ton activité
              Strava doit passer dans un rayon de {race.validation.corridorToleranceM} m.
            </AppText>
            {race.checkpoints.map((cp) => (
              <View key={cp.order} style={styles.cpRow}>
                <View style={styles.cpDot} />
                <AppText variant="caption" color={colors.textSecondary}>
                  CP{cp.order} · {cp.lat.toFixed(5)}, {cp.lng.toFixed(5)} · ±{cp.radiusM} m
                </AppText>
              </View>
            ))}
          </Section>
        )}

        {/* ── Fenêtre de tentative ─────────────────────── */}
        <Section title="FENÊTRE DE TENTATIVE">
          <View style={styles.windowRow}>
            <Ionicons name="play-circle-outline" size={18} color={colors.success} />
            <AppText variant="body" color={colors.textSecondary}>
              Ouverture : <AppText variant="body">{formatDate(race.startDate)}</AppText>
            </AppText>
          </View>
          <View style={styles.windowRow}>
            <Ionicons name="stop-circle-outline" size={18} color={colors.danger} />
            <AppText variant="body" color={colors.textSecondary}>
              Clôture : <AppText variant="body">{formatDate(race.endDate)}</AppText>
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textMuted}>
            Tentatives illimitées sur la saison. Seul le meilleur temps est retenu.
          </AppText>
        </Section>

        {/* ── Achat ────────────────────────────────────── */}
        <View style={styles.purchaseCard}>
          <View style={styles.purchaseInfo}>
            <AppText variant="heading">{price.toFixed(2)} €</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Accès saison {race.season} · tentatives illimitées
            </AppText>
          </View>
          <Button
            label={
              hasAccess
                ? 'Lancer une tentative'
                : isOpen
                ? 'Accéder à cette course'
                : 'Voir le palmarès'
            }
            onPress={() => {
              if (hasAccess) {
                navigation.navigate('SafetyBriefing', { raceId: race.id });
              } else if (isOpen) {
                navigation.navigate('Purchase', { raceId: race.id });
              } else {
                navigation.navigate('RaceLeaderboard', { raceId: race.id, season: race.season });
              }
            }}
          />
          {isOpen && (
            <AppText variant="caption" color={colors.textMuted} style={styles.purchaseNote}>
              Reversement organisateur inclus. Paiement via App Store (iOS) ou Stripe (web).
            </AppText>
          )}
        </View>

        {/* ── Disclaimer de sécurité ───────────────────── */}
        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={16} color={colors.accent} />
          <AppText variant="caption" color={colors.textMuted} style={styles.disclaimerText}>
            Parcours non balisé. Ni ravitaillement ni assistance. Tu cours seul
            et tu es seul responsable de ta sécurité et de ton matériel.
          </AppText>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Composants internes ─────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.wrapper}>
      <AppText variant="caption" color={colors.accent}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
}) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  centerText: { textAlign: 'center' },
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, gap: spacing.md },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeOpen: { backgroundColor: colors.accent },
  badgeArch: { backgroundColor: colors.surfaceElevated },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cpNote: { marginBottom: spacing.xs },
  cpRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cpDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  purchaseCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  purchaseInfo: { gap: 2 },
  purchaseNote: { textAlign: 'center' },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  disclaimerText: { flex: 1 },
});

const sectionStyles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
