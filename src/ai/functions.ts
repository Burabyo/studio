
'use server';
/**
 * @fileoverview This file defines the backend logic for the application using
 * standard Firebase Cloud Functions.
 */
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

// Initialize Firebase Admin SDK if it hasn't been already.
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = getFirestore();

// Zod schema for input validation
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


export const createEmployeeAccount = onCall({ cors: true }, async (request) => {
  // 1. Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  // 2. Input validation
  const validationResult = createEmployeeSchema.safeParse(request.data);
  if (!validationResult.success) {
    throw new HttpsError('invalid-argument', 'Invalid data provided.', validationResult.error.flatten());
  }
  
  const { email, password, companyId, name, role, id, ...restOfEmployeeData } = validationResult.data;
  const adminUid = request.auth.uid;

  // 3. Authorization check
  const adminUserDoc = await db.collection('users').doc(adminUid).get();
  const adminUserData = adminUserDoc.data();
  
  if (!adminUserDoc.exists || adminUserData?.companyId !== companyId || !['admin', 'manager'].includes(adminUserData?.role)) {
    throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
  }

  // 4. Business Logic
  let newUser;
  try {
    // Create the Firebase Auth user
    newUser = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Create the user profile document in the /users collection
    const userProfile = {
      uid: newUser.uid,
      name: name,
      email: email,
      role: role,
      companyId: companyId,
      employeeId: id,
    };
    await db.collection('users').doc(newUser.uid).set(userProfile);

    // Create the employee document in the company's subcollection
    const employeeRecord = {
      ...restOfEmployeeData,
      id: id,
      name: name,
      role: role,
      userId: newUser.uid,
      email: email,
    };
    
    const employeeDocRef = db.collection('companies').doc(companyId).collection('employees').doc(id);
    await employeeDocRef.set(employeeRecord);

    return { success: true, userId: newUser.uid };

  } catch (error: any) {
      // Cleanup: If user creation succeeded but Firestore failed, delete the user.
      if (newUser) {
          await admin.auth().deleteUser(newUser.uid).catch(e => console.error("Cleanup failed:", e));
      }

      console.error('Error creating employee:', error);
      
      if (error.code && error.code.startsWith('auth/')) {
          throw new HttpsError('already-exists', error.message, {code: error.code});
      }
      
      throw new HttpsError('internal', 'An internal server error occurred.');
  }
});
