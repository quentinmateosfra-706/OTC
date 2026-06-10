/**
 * Barre d'onglets principale (utilisateur connecté).
 * Catalogue · Bibliothèque · Classement · Profil.
 * Style aligné sur le thème : fond ardoise, accent jaune sur l'onglet actif.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';
import { CatalogScreen } from '@/screens/catalog/CatalogScreen';
import { LibraryScreen } from '@/screens/library/LibraryScreen';
import { LeaderboardScreen } from '@/screens/leaderboard/LeaderboardScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Icônes par onglet (variante outline / filled selon l'état actif). */
const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Catalog: 'map',
  Library: 'library',
  Leaderboard: 'podium',
  Settings: 'person',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.textPrimary, fontFamily: fonts.medium },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarIcon: ({ color, size, focused }) => {
          const base = ICONS[route.name];
          const name = (focused ? base : `${base}-outline`) as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Catalogue' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Bibliothèque' }} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Classement' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
