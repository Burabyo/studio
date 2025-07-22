
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache, persistentLocalCache } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache(/*settings*/),
});

const auth = getAuth(app);
const functions = getFunctions(app);

// Connect to the local Functions emulator if in development
if (process.env.NODE_ENV === 'development') {
    try {
        // Note: The Genkit emulator runs on a different port than the standard Functions emulator
        connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    } catch (e) {
        console.warn("Could not connect to functions emulator. Have you started it with 'npm run genkit:watch'?", e);
    }
}


export { app, db, auth, functions };
