/**
 * Initialisation de Firebase (app, auth, Firestore, Storage).
 *
 * - L'auth utilise une persistance AsyncStorage en React Native.
 * - Les Cloud Functions sont appelées dans la région europe-west1.
 *
 * Tant que la config n'est pas renseignée (.env), l'app peut tourner en
 * « mode démo » : `isFirebaseConfigured` permet d'afficher des données
 * factices plutôt que de planter.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { config, isFirebaseConfigured } from '@/constants/config';
import { Platform } from 'react-native';

const DEMO_CONFIG = { apiKey: '', authDomain: '', projectId: 'demo', storageBucket: '', messagingSenderId: '', appId: '' };
const app = getApps().length === 0 ? initializeApp(isFirebaseConfigured ? config.firebase : DEMO_CONFIG) : getApp();

function buildAuth() {
  if (!isFirebaseConfigured) return null as never;
  if (Platform.OS === 'web') {
    const { getAuth } = require('firebase/auth');
    return getAuth(app);
  }
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = buildAuth();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, config.functionsRegion);

export default app;
