/**
 * Écran « Manifeste » — sert d'accueil provisoire en Phase 1 et de
 * vitrine du thème « Trace Solitaire ». Il sera remplacé par le vrai
 * flux d'onboarding/auth en Phase 2-3.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';

export function ManifestoScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <AppText variant="caption" color={colors.accent}>
          OFF TRAIL CHALLENGE
        </AppText>

        <AppText variant="display" style={styles.title}>
          Seul avec une trace{'\n'}et la montagne.
        </AppText>

        <AppText variant="quote" color={colors.textSecondary} style={styles.quote}>
          « Pas de balisage. Pas de ravito. Pas de spectateurs. »
        </AppText>

        <AppText variant="body" color={colors.textSecondary} style={styles.body}>
          Télécharge la trace d'une course officielle, cours en totale
          autonomie avec ta montre GPS, importe ton activité — OTC valide
          ton parcours et t'inscrit au classement de la saison.
        </AppText>

        <View style={styles.spacer} />

        <Button label="Commencer" onPress={() => {}} />
        <Button
          label="En savoir plus"
          variant="ghost"
          onPress={() => {}}
          style={styles.secondaryBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  title: { marginTop: spacing.md },
  quote: { marginTop: spacing.lg },
  body: { marginTop: spacing.lg },
  spacer: { flex: 1 },
  secondaryBtn: { marginTop: spacing.sm },
});
