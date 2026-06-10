/**
 * Carte de course pour le catalogue.
 * Affiche : nom, région, distance, dénivelé, date officielle, prix.
 * La trace jaune Frontale est évoquée par une barre de couleur en haut.
 */
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { colors, spacing, radius } from '@/constants/theme';
import { formatDistance, formatElevation, formatDate } from '@/utils/time.formatter';
import type { Race } from '@/types/race.types';

interface RaceCardProps {
  race: Race;
  price?: number;
  onPress: () => void;
}

export function RaceCard({ race, price, onPress }: RaceCardProps) {
  const isOpen = race.status === 'active';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Course ${race.name}, ${formatDistance(race.distanceKm)}`}
    >
      {/* Trait jaune Frontale — évoque la trace GPX */}
      <View style={styles.trace} />

      <View style={styles.body}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="caption" color={colors.accent}>
              {race.region.toUpperCase()} · {race.season}
            </AppText>
            <AppText variant="heading" numberOfLines={1}>
              {race.name}
            </AppText>
          </View>
          {isOpen ? (
            <View style={styles.badge}>
              <AppText variant="caption" color={colors.background}>
                OUVERT
              </AppText>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeArchived]}>
              <AppText variant="caption" color={colors.textMuted}>
                ARCHIVÉ
              </AppText>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Stat icon="navigate-outline" label={formatDistance(race.distanceKm)} />
          <Stat icon="trending-up-outline" label={formatElevation(race.elevationGainM)} />
          <Stat
            icon="calendar-outline"
            label={formatDate(race.officialEventDate)}
          />
        </View>

        {/* Prix */}
        {price !== undefined && (
          <View style={styles.footer}>
            <AppText variant="caption" color={colors.textMuted}>
              Accès saison en cours
            </AppText>
            <AppText variant="heading" color={colors.accent}>
              {price.toFixed(2)} €
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Stat({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <View style={statStyles.row}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.88 },
  trace: {
    height: 3,
    backgroundColor: colors.accent,
  },
  body: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badgeArchived: { backgroundColor: colors.surfaceElevated },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
