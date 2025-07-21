
'use server';
import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export const getUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required.");
  }

  const uid = request.auth.uid;
  try {
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      throw new Error("User profile not found.");
    }

    return userDoc.data();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error("Failed to fetch user profile.");
  }
});
