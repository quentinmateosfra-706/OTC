/**
 * Aiguillage racine de l'application.
 *
 * - Si un utilisateur est connecté (ou mode démo Phase 2) → AppStack.
 * - Sinon → AuthStack.
 *
 * Le thème de navigation est aligné sur « Trace Solitaire » (fond ardoise).
 */
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { useAuthStore } from '@/store/useAuthStore';
import { colors } from '@/constants/theme';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

/** Thème de navigation dérivé de notre palette. */
const navTheme: NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
  fonts: DarkTheme.fonts,
};

export function RootNavigator() {
  const initializing = useAuthStore((s) => s.initializing);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const demoMode = useAuthStore((s) => s.demoMode);

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const isAuthenticated = firebaseUser !== null || demoMode;

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
