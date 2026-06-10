/**
 * Écran de résultat de validation.
 *
 * Cas possibles :
 * - VALID : affiche le temps officiel, le score GPS, les checkpoints, le badge meilleur temps.
 * - REJECTED : affiche la raison du rejet (lisible par le coureur).
 * - PENDING : la validation est encore en cours (spinner + polling léger).
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
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
import { colors, spacing, radius } from '@/constants/theme';
import { fetchAttemptById } from '@/services/attempt.service';
import { formatDuration } from '@/utils/time.formatter';
import type { Attempt } from '@/types/attempt.types';
import type { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'AttemptResult'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

export function AttemptResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { attemptId } = route.params;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const a = await fetchAttemptById(attemptId).catch(() => null);
      if (cancelled) return;

      setAttempt(a);
      setLoading(false);

      // Si encore en attente, on re-poll jusqu'à 10 fois (toutes les 3 s).
      if (a?.status === 'pending' && pollCount < 10) {
        setTimeout(() => {
          if (!cancelled) setPollCount((n) => n + 1);
        }, 3000);
      }
    }

    setLoading(true);
    void load();
    return () => { cancelled = true; };
  }, [attemptId, pollCount]);

  const isValid = attempt?.status === 'valid';
  const isRejected = attempt?.status === 'rejected';
  const isPending = !attempt || attempt.status === 'pending';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── En cours de validation ────────────────────── */}
        {(loading || isPending) && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
            <AppText variant="heading" style={styles.mt}>
              Validation en cours…
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.centerText}>
              On compare ton tracé GPS à la trace officielle.
              Ça prend généralement 10 à 30 secondes.
            </AppText>
          </View>
        )}

        {/* ── Tentative VALIDÉE ─────────────────────────── */}
        {isValid && attempt && (
          <>
            <View style={[styles.resultCard, styles.cardValid]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
              <AppText variant="caption" color={colors.success}>
                PARCOURS VALIDÉ
              </AppText>
              <AppText variant="display">
                {attempt.officialTimeSeconds
                  ? formatDuration(attempt.officialTimeSeconds)
                  : '—'}
              </AppText>
              {attempt.isBestTime && (
                <View style={styles.bestTimeBadge}>
                  <Ionicons name="trophy" size={14} color={colors.black} />
                  <AppText variant="caption" color={colors.black}>
                    NOUVEAU MEILLEUR TEMPS
                  </AppText>
                </View>
              )}
            </View>

            {/* Détails */}
            <View style={styles.details}>
              <AppText variant="caption" color={colors.accent}>DÉTAILS</AppText>

              <DetailRow
                icon="navigate-outline"
                label="Correspondance trace GPS"
                value={
                  attempt.gpsMatchScore != null
                    ? `${Math.round(attempt.gpsMatchScore * 100)} %`
                    : '—'
                }
                ok={attempt.gpsMatchScore != null && attempt.gpsMatchScore >= 0.85}
              />
              <DetailRow
                icon="location-outline"
                label="Checkpoints franchis"
                value={
                  attempt.checkpointsPassed != null
                    ? `${attempt.checkpointsPassed} / ${attempt.checkpointsPassed}`
                    : '—'
                }
                ok
              />
              <DetailRow
                icon="calendar-outline"
                label="Date de l'activité"
                value={new Date(attempt.activityDate).toLocaleDateString('fr-FR')}
                ok
              />
            </View>

            <Button
              label="Voir le classement"
              onPress={() =>
                navigation.navigate('RaceLeaderboard', {
                  raceId: attempt.raceId,
                  season: attempt.season,
                })
              }
            />
            <Button
              label="Retour à la bibliothèque"
              variant="secondary"
              onPress={() => navigation.navigate('Tabs', { screen: 'Library' })}
              style={styles.secondBtn}
            />
          </>
        )}

        {/* ── Tentative REJETÉE ─────────────────────────── */}
        {isRejected && attempt && (
          <>
            <View style={[styles.resultCard, styles.cardRejected]}>
              <Ionicons name="close-circle" size={56} color={colors.danger} />
              <AppText variant="caption" color={colors.danger}>
                PARCOURS NON VALIDÉ
              </AppText>
              <AppText variant="heading" style={styles.centerText}>
                Cette tentative n'a pas été retenue.
              </AppText>
            </View>

            {/* Raison du rejet */}
            <View style={styles.rejectionCard}>
              <AppText variant="caption" color={colors.accent}>
                RAISON DU REJET
              </AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {attempt.rejectionReason ?? 'Raison non précisée.'}
              </AppText>
            </View>

            {/* Détails techniques */}
            <View style={styles.details}>
              <AppText variant="caption" color={colors.accent}>DÉTAILS TECHNIQUES</AppText>
              {attempt.gpsMatchScore != null && (
                <DetailRow
                  icon="navigate-outline"
                  label="Correspondance GPS"
                  value={`${Math.round(attempt.gpsMatchScore * 100)} %`}
                  ok={attempt.gpsMatchScore >= 0.85}
                />
              )}
            </View>

            <AppText variant="body" color={colors.textSecondary} style={styles.retryNote}>
              Tu peux réessayer autant de fois que tu veux sur la saison.
              Les tentatives illimitées sont incluses dans ton accès.
            </AppText>

            <Button
              label="Réessayer — importer une autre activité"
              onPress={() => navigation.replace('ImportActivity', { raceId: attempt.raceId })}
            />
            <Button
              label="Retour à la bibliothèque"
              variant="ghost"
              onPress={() => navigation.navigate('Tabs', { screen: 'Library' })}
              style={styles.secondBtn}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <AppText variant="body" color={colors.textSecondary} style={detailStyles.label}>
        {label}
      </AppText>
      <View style={detailStyles.value}>
        <AppText variant="body" color={ok ? colors.success : colors.danger}>
          {value}
        </AppText>
        <Ionicons
          name={ok ? 'checkmark-circle' : 'close-circle'}
          size={14}
          color={ok ? colors.success : colors.danger}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  centerText: { textAlign: 'center' },
  mt: { marginTop: spacing.sm },
  resultCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
  },
  cardValid: { borderColor: `${colors.success}40` },
  cardRejected: { borderColor: `${colors.danger}30` },
  bestTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  details: { gap: spacing.md },
  rejectionCard: {
    backgroundColor: `${colors.danger}10`,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.danger}25`,
  },
  retryNote: { textAlign: 'center' },
  secondBtn: { marginTop: -spacing.sm },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  label: { flex: 1 },
  value: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
