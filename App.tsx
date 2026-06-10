/**
 * Point d'entrée de l'application OTC.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAppFonts } from '@/hooks/useAppFonts';
import { useAuthListener } from '@/hooks/useAuthListener';
import { useLoadPurchases } from '@/hooks/useLoadPurchases';

export default function App() {
  const fontsLoaded = useAppFonts();
  useAuthListener();
  useLoadPurchases();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
