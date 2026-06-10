/**
 * Hook de connexion Strava — orchestre le flux OAuth PKCE.
 *
 * Étapes :
 * 1. expo-auth-session ouvre le navigateur Strava (ou l'app Strava).
 * 2. L'utilisateur autorise OTC.
 * 3. Strava redirige vers `otc://strava-callback?code=...`
 * 4. On envoie le code à la Cloud Function.
 * 5. On met à jour le profil Firestore.
 *
 * ⚠️ Requiert un dev build EAS (Expo Go ne gère pas les custom schemes).
 */
import { useCallback } from 'react';
import {
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import { Alert } from 'react-native';
import {
  STRAVA_CLIENT_ID,
  STRAVA_SCOPES,
  getStravaRedirectUri,
  exchangeStravaCode,
  markStravaConnected,
} from '@/services/strava.service';
import { useAuthStore } from '@/store/useAuthStore';
import { isFirebaseConfigured } from '@/constants/config';

/** Point de découverte OAuth de Strava. */
const STRAVA_DISCOVERY = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
  revocationEndpoint: 'https://www.strava.com/oauth/deauthorize',
};

interface UseStravaConnectReturn {
  /** Lance le flux OAuth. */
  connect: () => Promise<void>;
  /** Vrai pendant la demande d'autorisation ou l'échange de token. */
  loading: boolean;
  /** Requête OAuth prête (null si clientId absent). */
  ready: boolean;
}

export function useStravaConnect(): UseStravaConnectReturn {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);

  const redirectUri = getStravaRedirectUri();

  // expo-auth-session gère le PKCE (code_verifier / code_challenge) automatiquement.
  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID || 'PLACEHOLDER',
      scopes: STRAVA_SCOPES,
      redirectUri,
      usePKCE: true,
    },
    STRAVA_DISCOVERY,
  );

  const connect = useCallback(async () => {
    if (!STRAVA_CLIENT_ID || STRAVA_CLIENT_ID === 'TODO') {
      Alert.alert(
        'Strava non configuré',
        'Ajoute EXPO_PUBLIC_STRAVA_CLIENT_ID dans ton fichier .env.',
      );
      return;
    }
    if (!isFirebaseConfigured || !firebaseUser) {
      Alert.alert('Non connecté', 'Tu dois être connecté pour lier Strava.');
      return;
    }

    try {
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') return;

      if (result.type === 'error') {
        Alert.alert('Erreur Strava', result.error?.message ?? 'Autorisation refusée.');
        return;
      }

      if (result.type === 'success') {
        const code = result.params.code;
        const tokenResult = await exchangeStravaCode(code);
        await markStravaConnected(firebaseUser.uid, tokenResult.athleteId);

        // Mise à jour locale du profil dans le store.
        if (profile) {
          setProfile({
            ...profile,
            strava: { connected: true, athleteId: tokenResult.athleteId },
          });
        }

        Alert.alert(
          'Strava connecté ✓',
          `Compte lié : ${tokenResult.firstname} ${tokenResult.lastname}`,
        );
      }
    } catch {
      Alert.alert(
        'Connexion Strava échouée',
        'Réessaie. Si le problème persiste, vérifie ta connexion internet.',
      );
    }
  }, [request, promptAsync, firebaseUser, profile, setProfile]);

  return {
    connect,
    loading: !request,
    ready: !!request,
  };
}
