/**
 * Écran d'import d'activité Strava + lancement de la validation.
 *
 * Flux :
 * 1. Charge les activités Strava récentes du coureur (via Cloud Function).
 * 2. Filtre sur les activités de type course (Run/TrailRun/Hike).
 * 3. L'utilisateur sélectionne une activité.
 * 4. On soumet l'activité à la Cloud Function `validateAttempt`.
 * 5. On redirige vers `AttemptResult` avec l'ID de la tentative.
 *
 * Pré-conditions :
 * - Strava connecté (sinon on propose la connexion).
 * - Course achetée (vérifiée en amont via bibliothèque).
 * - Checklist de sécurité validée (on arrive depuis SafetyBriefing).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  RefreshControl,
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
import { fetchStravaActivities } from '@/services/strava.service';
import { submitAttempt } from '@/services/attempt.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useAttemptStore } from '@/store/useAttemptStore';
import { isFirebaseConfigured } from '@/constants/config';
import { formatDuration, formatDistance, formatDate } from '@/utils/time.formatter';
import type { StravaActivity } from '@/types/strava.types';
import type { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ImportActivity'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

const CURRENT_SEASON = '2026';

export function ImportActivityScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { raceId } = route.params;

  const profile = useAuthStore((s) => s.profile);
  const setValidatingId = useAttemptStore((s) => s.setValidatingId);
  const addAttempt = useAttemptStore((s) => s.addAttempt);

  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<StravaActivity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stravaConnected = profile?.strava?.connected ?? false;

  const loadActivities = useCallback(async () => {
    if (!stravaConnected || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      // Filtre sur 90 jours (activités pertinentes pour la saison en cours).
      const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 3600;
      const list = await fetchStravaActivities(ninetyDaysAgo, 1);
      setActivities(list);
    } catch {
      Alert.alert(
        'Erreur Strava',
        'Impossible de récupérer tes activités. Vérifie ta connexion.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stravaConnected]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  async function handleSubmit() {
    if (!selected) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Mode démo', 'Validation indisponible sans Firebase.');
      return;
    }

    setSubmitting(true);
    const safetyAcknowledgedAt = new Date().toISOString();

    try {
      const result = await submitAttempt({
        raceId,
        stravaActivityId: String(selected.id),
        season: CURRENT_SEASON,
      });

      setValidatingId(result.attemptId);

      // Enregistrement local optimiste de la tentative.
      addAttempt({
        id: result.attemptId,
        userId: profile?.uid ?? '',
        raceId,
        season: CURRENT_SEASON,
        stravaActivityId: String(selected.id),
        importedAt: new Date().toISOString(),
        status: result.status,
        rejectionReason: result.rejectionReason ?? null,
        activityDate: selected.start_date,
        officialTimeSeconds: result.officialTimeSeconds ?? null,
        gpsMatchScore: result.gpsMatchScore ?? null,
        checkpointsPassed: result.checkpointsPassed ?? null,
        isBestTime: result.isBestTime ?? false,
        safetyAcknowledgedAt,
      });

      navigation.replace('AttemptResult', { attemptId: result.attemptId });
    } catch {
      Alert.alert(
        'Erreur de validation',
        'La validation a échoué. Réessaie dans quelques instants.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Strava non connecté ────────────────────────────────────────────────────
  if (!stravaConnected) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="link-outline" size={48} color={colors.accent} />
          <AppText variant="heading" style={styles.mt}>Strava non connecté</AppText>
          <AppText variant="body" color={colors.textSecondary} style={[styles.mt, styles.center2]}>
            Connecte ton compte Strava pour importer tes activités et valider tes parcours.
          </AppText>
          <Button
            label="Connecter Strava"
            onPress={() => navigation.navigate('StravaConnect')}
            style={styles.btn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={activities}
        keyExtractor={(a) => String(a.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadActivities(); }}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="caption" color={colors.accent}>
              SÉLECTIONNE TON ACTIVITÉ
            </AppText>
            <AppText variant="title">Activités récentes</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Choisis l'activité Strava correspondant à ta tentative sur ce parcours.
            </AppText>
            {loading && (
              <ActivityIndicator color={colors.accent} style={styles.spinner} />
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
              <AppText variant="body" color={colors.textSecondary} style={styles.mt}>
                Aucune activité de course trouvée dans les 90 derniers jours.
              </AppText>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            selected={selected?.id === item.id}
            onPress={() => setSelected(item)}
          />
        )}
        ListFooterComponent={
          activities.length > 0 ? (
            <View style={styles.footer}>
              {selected ? (
                <>
                  <View style={styles.selectedInfo}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <AppText variant="caption" color={colors.success}>
                      {selected.name} sélectionnée
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.textMuted} style={styles.warning}>
                    L'activité sera validée automatiquement. Ce processus prend
                    environ 10–30 secondes.
                  </AppText>
                  <Button
                    label="Valider cette tentative"
                    onPress={handleSubmit}
                    loading={submitting}
                  />
                </>
              ) : (
                <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                  Appuie sur une activité pour la sélectionner.
                </AppText>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Carte d'activité ─────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  selected,
  onPress,
}: {
  activity: StravaActivity;
  selected: boolean;
  onPress: () => void;
}) {
  const isManual = activity.manual || activity.trainer;

  return (
    <Pressable
      style={[cardStyles.card, selected && cardStyles.cardSelected]}
      onPress={onPress}
      disabled={isManual}
    >
      {selected && <View style={cardStyles.trace} />}
      <View style={cardStyles.body}>
        <View style={cardStyles.header}>
          <View style={cardStyles.titleBlock}>
            <AppText variant="body" numberOfLines={1} style={cardStyles.name}>
              {activity.name}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {formatDate(activity.start_date_local)}
            </AppText>
          </View>
          {selected && (
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          )}
          {isManual && (
            <Ionicons name="ban-outline" size={18} color={colors.danger} />
          )}
        </View>

        <View style={cardStyles.stats}>
          <Stat icon="navigate-outline" label={formatDistance(activity.distance / 1000)} />
          <Stat icon="time-outline" label={formatDuration(activity.moving_time)} />
          <Stat
            icon="trending-up-outline"
            label={`+${Math.round(activity.total_elevation_gain)} m`}
          />
          <View style={cardStyles.typeBadge}>
            <AppText variant="caption" color={colors.textMuted}>
              {activity.sport_type}
            </AppText>
          </View>
        </View>

        {isManual && (
          <AppText variant="caption" color={colors.danger}>
            Activité manuelle — non acceptée (pas de trace GPS)
          </AppText>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={colors.textMuted} />
      <AppText variant="caption" color={colors.textSecondary}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  center2: { textAlign: 'center' },
  mt: { marginTop: spacing.sm },
  btn: { marginTop: spacing.md, alignSelf: 'stretch' },
  header: { padding: spacing.lg, gap: spacing.sm },
  spinner: { marginTop: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  footer: { marginTop: spacing.lg, gap: spacing.md },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  warning: { lineHeight: 18 },
  hint: { textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardSelected: { borderColor: colors.accent },
  trace: { height: 3, backgroundColor: colors.accent },
  body: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titleBlock: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
});
