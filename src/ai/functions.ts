
/**
 * @fileoverview This file is retained for potential future use with standard Firebase Functions,
 * but the primary backend logic for this application is now defined as Genkit actions
 * in `src/ai/dev.ts` to facilitate local development and emulation.
 */
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK if it hasn't been already.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// No functions are defined here by default. Add Genkit actions in `src/ai/dev.ts`.
