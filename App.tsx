/**
 * Point d'entrée de l'application OTC.
 *
 * Phase 1 : affiche le Manifeste (vitrine du thème). La navigation
 * complète (Auth / App) arrive en Phase 2.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ManifestoScreen } from '@/screens/ManifestoScreen';
import { useAppFonts } from '@/hooks/useAppFonts';

export default function App() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return null; // splash screen géré en Phase 2
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ManifestoScreen />
    </SafeAreaProvider>
  );
}
