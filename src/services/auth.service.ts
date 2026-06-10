/**
 * Service d'authentification Firebase.
 *
 * Gère : email/mot de passe, Google OAuth, Apple OAuth, déconnexion,
 * et la création/mise à jour du profil coureur dans Firestore.
 *
 * Aucune logique métier ne doit apparaître dans les écrans : ils
 * appellent ces fonctions et réagissent aux erreurs.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  type UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile } from '@/types/user.types';

// ─── Email / mot de passe ────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

// ─── Connexion Google ────────────────────────────────────────────────────────

export async function signInWithGoogle(idToken: string): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

// ─── Connexion Apple ─────────────────────────────────────────────────────────

export async function signInWithApple(
  idToken: string,
  nonce: string,
): Promise<UserCredential> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce: nonce });
  return signInWithCredential(auth, credential);
}

// ─── Déconnexion ─────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

// ─── Profil coureur Firestore ────────────────────────────────────────────────

/** Crée le document profil si absent (appelé juste après la création de compte). */
export async function createUserProfile(
  uid: string,
  data: Pick<UserProfile, 'email' | 'displayName'>,
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // profil déjà créé (reconnexion sociale)

  await setDoc(ref, {
    email: data.email,
    displayName: data.displayName,
    club: null,
    birthDate: null,
    sex: null,
    city: null,
    region: null,
    role: 'user',
    strava: { connected: false, athleteId: null },
    createdAt: serverTimestamp(),
  });
}

/** Récupère le profil coureur depuis Firestore. */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

/** Met à jour les champs modifiables du profil coureur. */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'club' | 'birthDate' | 'sex' | 'city' | 'region'>>,
): Promise<void> {
  await setDoc(doc(db, 'users', uid), updates, { merge: true });
}

// ─── Consentements RGPD ──────────────────────────────────────────────────────

/**
 * Enregistre un consentement côté client (version minimale Phase 3).
 * En production, l'ip sera capturée et vérifiée côté Cloud Function.
 */
export async function recordConsent(
  uid: string,
  type: 'disclaimer' | 'cgu' | 'cgv' | 'privacy',
  version: string,
): Promise<void> {
  const consentId = `${type}_${version}`;
  await setDoc(doc(db, 'users', uid, 'consents', consentId), {
    type,
    version,
    acceptedAt: serverTimestamp(),
    ipAddress: null, // sera renseigné par la Cloud Function en V2
  });
}
