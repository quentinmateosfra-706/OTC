/**
 * Types de navigation — décrivent toutes les routes et leurs paramètres.
 * Permet l'autocomplétion et la vérification des `navigate(...)`.
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

/** Pile d'authentification (utilisateur déconnecté). */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Disclaimer: undefined;
};

/** Onglets principaux (utilisateur connecté). */
export type MainTabParamList = {
  Catalog: undefined;
  Library: undefined;
  Leaderboard: undefined;
  Settings: undefined;
};

/** Pile applicative : les onglets + écrans empilés par-dessus. */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  RaceDetail: { raceId: string };
  Purchase: { raceId: string };
  SafetyBriefing: { raceId: string };
  ImportActivity: { raceId: string };
  RaceLeaderboard: { raceId: string; season: string };
  StravaConnect: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends AppStackParamList {}
  }
}
