import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore
const db = getFirestore(app);

// Auth
const auth = getAuth(app);

// Functions
const functions = getFunctions(app);

// Connect to local Functions emulator in development
if (process.env.NODE_ENV === "development") {
  try {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    console.log("Connected to Functions emulator");
  } catch (e) {
    console.warn(
      "Could not connect to Functions emulator. Make sure it is running on localhost:5001",
      e
    );
  }
}

export { app, db, auth, functions };
