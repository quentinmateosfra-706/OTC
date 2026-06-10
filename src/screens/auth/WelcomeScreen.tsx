/**
 * Écran d'accueil (Manifeste) — première impression, vitrine du thème
 * « Trace Solitaire ». Oriente vers connexion / inscription.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const setDemoMode = useAuthStore((s) => s.setDemoMode);

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

        <Button label="Créer un compte" onPress={() => navigation.navigate('Register')} />
        <Button
          label="J'ai déjà un compte"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
          style={styles.secondaryBtn}
        />
        {/* Temporaire (Phase 2) : explorer l'app sans compte. Retiré en Phase 3. */}
        <Button
          label="Aperçu démo"
          variant="ghost"
          onPress={() => setDemoMode(true)}
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
