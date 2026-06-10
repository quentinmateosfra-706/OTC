/**
 * Écran Profil & Réglages.
 *
 * - Affiche et permet d'éditer le profil coureur (club, ville, région, sexe, naissance).
 * - Accès à la connexion Strava (Phase 4).
 * - Mentions légales + déconnexion.
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { colors, spacing, radius } from '@/constants/theme';
import { signOut, updateUserProfile } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import type { AppStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const reset = useAuthStore((s) => s.reset);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: profile?.displayName ?? '',
    club: profile?.club ?? '',
    city: profile?.city ?? '',
    region: profile?.region ?? '',
  });

  function field(key: keyof typeof form) {
    return (val: string) => setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateUserProfile(firebaseUser.uid, {
        displayName: form.displayName.trim(),
        club: form.club.trim() || null,
        city: form.city.trim() || null,
        region: form.region.trim() || null,
      });
      setProfile(profile ? { ...profile, ...form } : null);
      setEditing(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessaie.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Déconnexion', 'Confirmer la déconnexion ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset();
        },
      },
    ]);
  }

  const displayEmail = firebaseUser?.email ?? profile?.email ?? '—';
  const stravaConnected = profile?.strava?.connected ?? false;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* En-tête profil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <AppText variant="heading" color={colors.black}>
              {(profile?.displayName ?? '?')[0].toUpperCase()}
            </AppText>
          </View>
          <View style={styles.headerText}>
            <AppText variant="heading">{profile?.displayName ?? '—'}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {displayEmail}
            </AppText>
          </View>
          <Pressable onPress={() => setEditing((e) => !e)} hitSlop={12}>
            <Ionicons
              name={editing ? 'close-outline' : 'create-outline'}
              size={22}
              color={colors.accent}
            />
          </Pressable>
        </View>

        {/* Formulaire édition */}
        {editing ? (
          <View style={styles.section}>
            <AppText variant="caption" color={colors.accent}>
              MODIFIER LE PROFIL
            </AppText>
            <TextInput
              label="Prénom / Pseudo"
              value={form.displayName}
              onChangeText={field('displayName')}
              autoCapitalize="words"
            />
            <TextInput
              label="Club (optionnel)"
              value={form.club}
              onChangeText={field('club')}
              autoCapitalize="words"
            />
            <TextInput
              label="Ville (optionnel)"
              value={form.city}
              onChangeText={field('city')}
              autoCapitalize="words"
            />
            <TextInput
              label="Région (optionnel)"
              value={form.region}
              onChangeText={field('region')}
              autoCapitalize="words"
            />
            <Button label="Enregistrer" onPress={handleSave} loading={saving} />
            <Button
              label="Annuler"
              variant="ghost"
              onPress={() => setEditing(false)}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Row label="Club" value={profile?.club ?? '—'} />
            <Row label="Ville" value={profile?.city ?? '—'} />
            <Row label="Région" value={profile?.region ?? '—'} />
          </View>
        )}

        {/* Strava */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.accent}>
            INTÉGRATIONS
          </AppText>
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('StravaConnect')}
          >
            <View style={styles.rowLeft}>
              <AppText variant="body">Strava</AppText>
              <AppText variant="caption" color={stravaConnected ? colors.success : colors.textMuted}>
                {stravaConnected ? 'Connecté' : 'Non connecté — requis pour valider'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Légal */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.accent}>
            MENTIONS LÉGALES
          </AppText>
          <LegalRow label="Conditions générales d'utilisation" />
          <LegalRow label="Conditions générales de vente" />
          <LegalRow label="Politique de confidentialité" />
          <LegalRow label="Décharge de responsabilité" />
        </View>

        {/* Déconnexion */}
        <Button
          label="Se déconnecter"
          variant="secondary"
          onPress={handleSignOut}
          style={styles.signout}
        />

        <AppText variant="caption" color={colors.textMuted} style={styles.version}>
          OTC v0.1.0 · Saison 2026
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <AppText variant="caption" color={colors.textMuted} style={infoStyles.label}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

function LegalRow({ label }: { label: string }) {
  return (
    <Pressable
      style={infoStyles.legalRow}
      onPress={() => Alert.alert(label, 'Document disponible prochainement.')}
    >
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  section: {
    gap: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowLeft: { gap: 2 },
  signout: { marginTop: spacing.sm },
  version: { textAlign: 'center', marginBottom: spacing.lg },
});

const infoStyles = StyleSheet.create({
  row: { gap: 2 },
  label: { marginBottom: 0 },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
});
