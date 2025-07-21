
'use server';
import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

// Correctly initialize the Firebase Admin SDK.
// This ensures the function has the necessary permissions to access Firestore.
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export const getUserProfile = onCall(async (request) => {
  // 1. Check if the user is authenticated.
  if (!request.auth) {
    // Throwing an HttpsError is the standard way to send errors back to the client.
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const uid = request.auth.uid;
  try {
    // 2. Fetch the user's document from the 'users' collection.
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    // 3. Check if the user's profile document exists.
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User profile not found."
      );
    }

    // 4. Return the user's data.
    return userDoc.data();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // 5. If any other error occurs, throw a generic internal error.
    throw new functions.https.HttpsError(
      "internal",
      "Failed to fetch user profile."
    );
  }
});
