/**
 * Écran de connexion Strava.
 *
 * Explique pourquoi c'est obligatoire (validation du parcours),
 * affiche l'état de connexion courant, et propose connect/déconnect.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, spacing, radius } from '@/constants/theme';
import { useStravaConnect } from '@/hooks/useStravaConnect';
import { disconnectStrava } from '@/services/strava.service';
import { useAuthStore } from '@/store/useAuthStore';

export function StravaConnectScreen() {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const { connect, loading } = useStravaConnect();
  const [disconnecting, setDisconnecting] = useState(false);

  const stravaConnected = profile?.strava?.connected ?? false;

  async function handleDisconnect() {
    if (!firebaseUser) return;
    Alert.alert(
      'Déconnecter Strava',
      "Tu ne pourras plus importer d'activités ni valider de parcours tant que Strava n'est pas reconnecté.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            setDisconnecting(true);
            try {
              await disconnectStrava(firebaseUser.uid);
              if (profile) {
                setProfile({ ...profile, strava: { connected: false, athleteId: null } });
              }
            } catch {
              Alert.alert('Erreur', 'Déconnexion échouée. Réessaie.');
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Statut visuel */}
        <View style={[styles.statusCard, stravaConnected ? styles.cardOk : styles.cardWarn]}>
          <Ionicons
            name={stravaConnected ? 'checkmark-circle' : 'warning-outline'}
            size={32}
            color={stravaConnected ? colors.success : colors.accent}
          />
          <View style={styles.statusText}>
            <AppText variant="heading">
              {stravaConnected ? 'Strava connecté' : 'Strava non connecté'}
            </AppText>
            {stravaConnected && profile?.strava?.athleteId ? (
              <AppText variant="caption" color={colors.textSecondary}>
                Athlète #{profile.strava.athleteId}
              </AppText>
            ) : (
              <AppText variant="caption" color={colors.textSecondary}>
                Obligatoire pour valider tes parcours
              </AppText>
            )}
          </View>
        </View>

        {/* Explication */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.accent}>
            POURQUOI STRAVA ?
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            OTC importe ta trace GPS directement depuis Strava pour valider
            automatiquement ton parcours. Aucun relevé manuel, aucune fraude
            possible : c'est ta montre qui parle.
          </AppText>
        </View>

        <View style={styles.infoCards}>
          <InfoCard
            icon="lock-closed-outline"
            title="Tes tokens sont protégés"
            desc="Le client_secret Strava et tes tokens d'accès ne transitent jamais sur ton téléphone. Ils sont chiffrés côté serveur."
          />
          <InfoCard
            icon="eye-outline"
            title="Accès limité"
            desc="OTC ne demande que activity:read_all — lecture de tes activités. Aucune écriture sur ton compte Strava."
          />
          <InfoCard
            icon="cloud-download-outline"
            title="Import à la demande"
            desc="Tes activités ne sont jamais aspirées en masse. On importe uniquement ce que tu sélectionnes."
          />
        </View>

        {/* Dev build notice */}
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <AppText variant="caption" color={colors.textMuted} style={styles.noticeText}>
            La connexion Strava nécessite un dev build EAS (pas Expo Go).
            Utilise{' '}
            <AppText variant="caption" color={colors.accent}>
              eas build --profile development
            </AppText>
            {' '}pour générer ton build de développement.
          </AppText>
        </View>

        {/* CTA */}
        {stravaConnected ? (
          <Button
            label="Déconnecter Strava"
            variant="secondary"
            onPress={handleDisconnect}
            loading={disconnecting}
          />
        ) : (
          <Button
            label="Connecter Strava"
            onPress={connect}
            loading={loading}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc: string;
}) {
  return (
    <View style={cardStyles.card}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View style={cardStyles.text}>
        <AppText variant="caption" color={colors.textPrimary}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {desc}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  cardOk: {
    backgroundColor: `${colors.success}15`,
    borderColor: `${colors.success}40`,
  },
  cardWarn: {
    backgroundColor: `${colors.accent}15`,
    borderColor: `${colors.accent}40`,
  },
  statusText: { flex: 1, gap: 2 },
  section: { gap: spacing.sm },
  infoCards: { gap: spacing.sm },
  notice: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { flex: 1 },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  text: { flex: 1, gap: 4 },
});
