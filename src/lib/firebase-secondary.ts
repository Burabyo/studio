// lib/firebase-secondary.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Use a different app name so it doesn't clash with the default one
const secondaryApp = getApps().find(app => app.name === "SECONDARY")
  || initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    },
    "SECONDARY" // 👈 this is important
  );

export const secondaryAuth = getAuth(secondaryApp);
