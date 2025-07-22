
'use server';

import { config } from 'dotenv';
config();

import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { ai } from './genkit';
import { z } from 'zod';


// Initialize the Firebase Admin SDK.
// This must be done ONCE. The check prevents re-initialization on hot reloads.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = getFirestore();

// All backend logic for creating an employee has been moved to a standard 
// Next.js API route at /api/create-employee for stability.
// This file is no longer used for that purpose.
