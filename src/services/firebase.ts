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
// @ts-expect-error — getReactNativePersistence n'est pas exporté dans les types
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/constants/config';

// Évite la double initialisation lors du Fast Refresh.
const app = getApps().length === 0 ? initializeApp(config.firebase) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, config.functionsRegion);

export default app;
