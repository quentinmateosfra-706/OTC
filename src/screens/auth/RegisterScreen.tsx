/**
 * Écran d'inscription.
 * 1. Saisie email + mot de passe.
 * 2. Création du compte Firebase.
 * 3. Création du profil Firestore.
 * 4. Redirection vers la décharge de responsabilité (obligatoire).
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
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Divider } from '@/components/ui/Divider';
import { colors, spacing } from '@/constants/theme';
import { signUpWithEmail, createUserProfile } from '@/services/auth.service';
import { isFirebaseConfigured } from '@/constants/config';
import type { AuthStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = 'Ton prénom / pseudo est requis';
    if (!email.trim()) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide';
    if (password.length < 8) e.password = 'Au moins 8 caractères';
    if (password !== confirm) e.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Mode démo', 'Firebase non configuré — inscription réelle indisponible.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await signUpWithEmail(email.trim(), password);
      await createUserProfile(user.uid, {
        email: user.email ?? email.trim(),
        displayName: displayName.trim(),
      });
      // Obligatoire : décharge de responsabilité avant d'entrer dans l'app.
      navigation.navigate('Disclaimer');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? '';
      Alert.alert('Inscription échouée', friendlyRegisterError(msg));
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
          <AppText variant="title">Créer un compte</AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
            Tu courras seul. Crée ton compte pour valider tes tentatives.
          </AppText>

          <View style={styles.form}>
            <TextInput
              label="Prénom / Pseudo"
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              autoCapitalize="words"
              textContentType="name"
            />
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
              label="Mot de passe (8 caractères min.)"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              textContentType="newPassword"
            />
            <TextInput
              label="Confirmer le mot de passe"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              secureTextEntry
              textContentType="newPassword"
            />

            <Button
              label="Créer mon compte"
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          <Divider label="ou" />

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
              Déjà un compte ?{' '}
            </AppText>
            <AppText
              variant="caption"
              color={colors.accent}
              onPress={() => navigation.navigate('Login')}
            >
              Se connecter
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function friendlyRegisterError(msg: string): string {
  if (msg.includes('email-already-in-use'))
    return 'Cet email est déjà utilisé. Connecte-toi plutôt.';
  if (msg.includes('weak-password'))
    return 'Mot de passe trop faible. Utilise au moins 8 caractères.';
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
