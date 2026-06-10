/**
 * Pile applicative (utilisateur connecté) : la barre d'onglets, plus
 * les écrans qui s'empilent par-dessus (fiche course, sécurité, import…).
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '@/constants/theme';
import { MainTabs } from './MainTabs';
import { RaceDetailScreen } from '@/screens/catalog/RaceDetailScreen';
import { SafetyBriefingScreen } from '@/screens/attempt/SafetyBriefingScreen';
import { ImportActivityScreen } from '@/screens/attempt/ImportActivityScreen';
import { RaceLeaderboardScreen } from '@/screens/leaderboard/RaceLeaderboardScreen';
import { StravaConnectScreen } from '@/screens/settings/StravaConnectScreen';
import { PurchaseScreen } from '@/screens/purchase/PurchaseScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.textPrimary, fontFamily: fonts.medium },
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="RaceDetail" component={RaceDetailScreen} options={{ title: 'Course' }} />
      <Stack.Screen
        name="Purchase"
        component={PurchaseScreen}
        options={{ title: 'Accéder', presentation: 'modal' }}
      />
      <Stack.Screen
        name="SafetyBriefing"
        component={SafetyBriefingScreen}
        options={{ title: 'Sécurité', presentation: 'modal' }}
      />
      <Stack.Screen
        name="ImportActivity"
        component={ImportActivityScreen}
        options={{ title: 'Importer' }}
      />
      <Stack.Screen
        name="RaceLeaderboard"
        component={RaceLeaderboardScreen}
        options={{ title: 'Classement' }}
      />
      <Stack.Screen
        name="StravaConnect"
        component={StravaConnectScreen}
        options={{ title: 'Strava' }}
      />
    </Stack.Navigator>
  );
}
