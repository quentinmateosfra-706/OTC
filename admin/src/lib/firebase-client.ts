import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const app =
  getApps().length === 0
    ? initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    : getApps()[0];

export const clientAuth = getAuth(app);
