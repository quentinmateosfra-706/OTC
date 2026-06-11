/**
 * Écran de décharge de responsabilité — étape OBLIGATOIRE à l'inscription.
 *
 * Contraintes légales impératives (§10 du cahier des charges) :
 * - Cases à cocher NON pré-cochées.
 * - L'utilisateur doit activement valider chaque consentement.
 * - Horodatage + version stockés dans `users/{uid}/consents`.
 * - Pas de bouton « Continuer » actif tant que tout n'est pas coché.
 *
 * OTC n'est pas un organisateur de course. Le coureur est SEUL
 * responsable de sa sécurité, de son matériel et de sa préparation.
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConsentCheckbox } from '@/components/ConsentCheckbox';
import { colors, spacing } from '@/constants/theme';
import { recordConsent } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { isFirebaseConfigured } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/types';

// Version du texte de décharge (à incrémenter si le texte change).
const DISCLAIMER_VERSION = '2026-01-v1';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Disclaimer'>;

export function DisclaimerScreen() {
  const navigation = useNavigation<Nav>();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const [loading, setLoading] = useState(false);

  // Quatre consentements distincts — tous obligatoires, tous non pré-cochés.
  const [checks, setChecks] = useState({
    solo: false, // je cours seul, sans assistance ni sécurité organisée
    gear: false, // j'emporte le matériel obligatoire
    risk: false, // j'accepte les risques inhérents au trail autonome
    legal: false, // j'ai lu et j'accepte les CGU, CGV et politique de confidentialité
  });

  const allChecked = Object.values(checks).every(Boolean);

  function toggle(key: keyof typeof checks) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleAccept() {
    if (!allChecked) return;

    if (!isFirebaseConfigured || !firebaseUser) {
      // En mode démo / sans Firebase : on laisse passer sans enregistrer.
      Alert.alert(
        'Décharge acceptée',
        'En production, ton accord sera horodaté et conservé.',
        [{ text: 'Continuer', onPress: () => navigation.navigate('Welcome') }],
      );
      return;
    }

    setLoading(true);
    try {
      // Enregistrement horodaté de chaque consentement distinct.
      await Promise.all([
        recordConsent(firebaseUser.uid, 'disclaimer', DISCLAIMER_VERSION),
        recordConsent(firebaseUser.uid, 'cgu', DISCLAIMER_VERSION),
        recordConsent(firebaseUser.uid, 'cgv', DISCLAIMER_VERSION),
        recordConsent(firebaseUser.uid, 'privacy', DISCLAIMER_VERSION),
      ]);
      // Décharge acceptée : onAuthStateChanged va rediriger vers l'AppStack.
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer ton accord. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* En-tête éditorial */}
        <AppText variant="caption" color={colors.accent}>
          AVANT DE COURIR
        </AppText>
        <AppText variant="title" style={styles.title}>
          Tu cours seul.{'\n'}C'est ta responsabilité.
        </AppText>
        <AppText variant="quote" color={colors.textSecondary} style={styles.quote}>
          « OTC fournit un GPX, un chrono et un classement.{'\n'}
          Rien d'autre. »
        </AppText>

        {/* Texte de décharge */}
        <View style={styles.card}>
          <AppText variant="body" color={colors.textSecondary}>
            OTC <AppText variant="body" color={colors.textPrimary}>n'est pas un organisateur de course.</AppText>
            {' '}L'application met à disposition une trace GPX officielle et un
            système de validation automatique basé sur les données GPS
            importées depuis Strava.
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.paragraph}>
            En courant sur un parcours OTC, tu t'engages sur un itinéraire de
            montagne <AppText variant="body" color={colors.textPrimary}>sans balisage, sans ravitaillement, sans assistance
            médicale et sans organisation de secours.</AppText>
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.paragraph}>
            Tu es <AppText variant="body" color={colors.textPrimary}>seul responsable</AppText> de :
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.bullet}>
            • Ta préparation physique et technique
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.bullet}>
            • Ton matériel de sécurité (eau, alimentation, téléphone chargé, couverture de survie, vêtements chauds selon distance et saison)
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.bullet}>
            • La vérification des conditions météo avant le départ
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.bullet}>
            • La reconnaissance préalable du parcours si nécessaire
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.bullet}>
            • Prévenir un proche du départ, du retour et de l'itinéraire prévu
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.bullet}>
            • Respecter la réglementation locale (zones protégées, arrêtés préfectoraux…)
          </AppText>
        </View>

        {/* Cases à cocher — NON pré-cochées */}
        <View style={styles.checkboxes}>
          <ConsentCheckbox
            checked={checks.solo}
            onChange={() => toggle('solo')}
            label="Je comprends que je cours seul, sans balisage, sans ravitaillement et sans assistance organisée par OTC."
          />
          <ConsentCheckbox
            checked={checks.gear}
            onChange={() => toggle('gear')}
            label="Je m'engage à emporter le matériel de sécurité adapté à la distance et aux conditions avant chaque tentative."
          />
          <ConsentCheckbox
            checked={checks.risk}
            onChange={() => toggle('risk')}
            label="J'accepte les risques inhérents à la pratique du trail autonome en montagne et dégage OTC de toute responsabilité en cas d'accident ou d'incident."
          />
          <ConsentCheckbox
            checked={checks.legal}
            onChange={() => toggle('legal')}
            label="J'ai lu et j'accepte les"
            linkText="CGU, CGV et politique de confidentialité."
            onLinkPress={() =>
              Alert.alert('Documents légaux', 'Disponibles dans Réglages > Mentions légales.')
            }
          />
        </View>

        <Button
          label="J'ai lu et j'accepte"
          onPress={handleAccept}
          disabled={!allChecked}
          loading={loading}
          style={styles.cta}
        />

        <AppText variant="caption" color={colors.textMuted} style={styles.legal}>
          Ton accord est horodaté, associé à la version {DISCLAIMER_VERSION} de
          ce document et conservé conformément au RGPD. Tu pourras demander
          sa suppression depuis Réglages → Confidentialité.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  title: { marginTop: spacing.xs },
  quote: { marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  paragraph: { marginTop: spacing.xs },
  bullet: { paddingLeft: spacing.sm },
  checkboxes: { gap: spacing.md },
  cta: { marginTop: spacing.sm },
  legal: { textAlign: 'center', marginBottom: spacing.lg },
});
