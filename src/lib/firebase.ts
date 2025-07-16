
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Helper function to clean up environment variables
const cleanVar = (variable: string | undefined): string => {
  if (!variable) {
    return "";
  }
  // Trim whitespace and remove any trailing commas or quotes
  return variable.trim().replace(/,$/, "").replace(/^"|"$/g, "");
};

const firebaseConfig = {
  apiKey: cleanVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// This will throw a clear error if the API key is not set,
// making it easier to debug.
if (!firebaseConfig.apiKey) {
  throw new Error("Missing Firebase API Key. Please make sure to set NEXT_PUBLIC_FIREBASE_API_KEY in your .env.local file");
}

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn('Firestore persistence failed: multiple tabs open.');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn('Firestore persistence not available in this browser.');
    }
  });
