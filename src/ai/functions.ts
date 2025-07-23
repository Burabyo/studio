
'use server';

/**
 * @fileoverview This file defines the backend logic for the application using
 * standard Firebase Cloud Functions.
 */

import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https'; // ✅ Correct import
import { HttpsError } from 'firebase-functions/v2/https'; // ✅ Correct import
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

// ✅ Initialize Firebase Admin SDK only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = getFirestore();

// ✅ Input validation schema using Zod
const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyId: z.string(),
  id: z.string(),
  name: z.string(),
  jobTitle: z.string(),
  employmentType: z.enum(["Monthly Salary", "Daily Wages"]),
  salary: z.coerce.number(),
  bankName: z.string(),
  accountNumber: z.string(),
  role: z.enum(["employee", "manager"]),
});

// ✅ Cloud Function to create employee account
export const createEmployeeAccount = onCall({ cors: true }, async (request) => {
  // 1. Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  // 2. Input validation
  const validationResult = createEmployeeSchema.safeParse(request.data);
  if (!validationResult.success) {
    console.error('Validation failed', validationResult.error.flatten());
    throw new HttpsError('invalid-argument', 'Invalid data provided.', validationResult.error.flatten());
  }

  const { email, password, companyId, name, role, id, ...restOfEmployeeData } = validationResult.data;
  const adminUid = request.auth.uid;

  // 3. Authorization check
  try {
    const adminUserDoc = await db.collection('users').doc(adminUid).get();
    const adminUserData = adminUserDoc.data();

    if (!adminUserDoc.exists || adminUserData?.companyId !== companyId || !['admin', 'manager'].includes(adminUserData?.role)) {
      throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }
  } catch (error) {
    console.error("Authorization check failed:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Could not verify user permissions.');
  }

  // 4. Business Logic
  let newUser;
  try {
    // Create the Firebase Auth user
    newUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Create user profile in the `/users` collection
    const userProfile = {
      uid: newUser.uid,
      name,
      email,
      role,
      companyId,
      employeeId: id,
    };
    await db.collection('users').doc(newUser.uid).set(userProfile);

    // Create employee record in the company subcollection
    const employeeRecord = {
      ...restOfEmployeeData,
      id,
      name,
      role,
      userId: newUser.uid,
      email,
    };
    const employeeDocRef = db.collection('companies').doc(companyId).collection('employees').doc(id);
    await employeeDocRef.set(employeeRecord);

    return { success: true, userId: newUser.uid };

  } catch (error: any) {
    // Cleanup: Delete Firebase Auth user if Firestore operations fail
    if (newUser) {
      await admin.auth().deleteUser(newUser.uid).catch(e =>
        console.error("Failed to clean up orphaned auth user:", e)
      );
    }

    console.error('Error creating employee:', error);

    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
      throw new HttpsError('already-exists', error.message, { code: error.code });
    }

    throw new HttpsError('internal', 'An internal server error occurred while creating the employee.');
  }
});
