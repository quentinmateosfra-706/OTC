/**
 * Écran de connexion — email/mot de passe + Apple + Google.
 * Logique d'auth déléguée à auth.service.ts, pas dans ce composant.
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Divider } from '@/components/ui/Divider';
import { colors, spacing } from '@/constants/theme';
import { signInWithEmail } from '@/services/auth.service';
import { isFirebaseConfigured } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide';
    if (!password) e.password = 'Mot de passe requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Mode démo', 'Firebase non configuré — connexion réelle indisponible.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // onAuthStateChanged dans useAuthListener prend le relais.
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Erreur de connexion';
      Alert.alert('Connexion échouée', friendlyAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="title">Connexion</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
            Retrouve tes courses et ton classement.
          </AppText>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
            />

            <Button label="Se connecter" onPress={handleLogin} loading={loading} />

            <Button
              label="Mot de passe oublié ?"
              variant="ghost"
              onPress={() =>
                Alert.alert(
                  'Réinitialisation',
                  'Fonctionnalité disponible — entre ton email puis appuie ici.',
                )
              }
            />
          </View>

          <Divider label="ou" />

          {/* Apple Sign-In — iOS uniquement */}
          {Platform.OS === 'ios' && (
            <Button
              label="Continuer avec Apple"
              variant="secondary"
              onPress={() => Alert.alert('Apple', 'Disponible avec un dev build EAS.')}
              style={styles.socialBtn}
            />
          )}

          <Button
            label="Continuer avec Google"
            variant="secondary"
            onPress={() => Alert.alert('Google', 'Disponible avec un dev build EAS.')}
            style={styles.socialBtn}
          />

          <View style={styles.footer}>
            <AppText variant="caption" color={colors.textMuted}>
              Pas encore de compte ?{' '}
            </AppText>
            <AppText
              variant="caption"
              color={colors.accent}
              onPress={() => navigation.navigate('Register')}
            >
              S'inscrire
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Traduit les codes d'erreur Firebase en messages lisibles. */
function friendlyAuthError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'Email ou mot de passe incorrect.';
  if (msg.includes('too-many-requests'))
    return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (msg.includes('network-request-failed'))
    return 'Pas de connexion internet.';
  return 'Une erreur est survenue. Réessaie.';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  sub: { marginTop: spacing.xs },
  form: { gap: spacing.md },
  socialBtn: { marginTop: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
});
