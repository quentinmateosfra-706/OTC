/**
 * Point d'entrée de l'application OTC.
 *
 * Phase 2 : met en place la navigation complète (aiguillage Auth / App,
 * onglets principaux). L'auth réelle arrive en Phase 3 ; un « mode démo »
 * temporaire permet d'explorer les onglets dès maintenant.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useAuthListener } from '@/hooks/useAuthListener';

export default function App() {
  const fontsLoaded = useAppFonts();
  useAuthListener();

  if (!fontsLoaded) {
    return null; // splash screen géré plus tard
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
