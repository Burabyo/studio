
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

// THIS IS THE FIX: The schema now correctly includes all fields passed from the frontend and coerces salary to a number.
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

ai.onCall(
  'createEmployeeAccount',
  {
    inputSchema: createEmployeeSchema,
    // No specific output schema needed, will return success or throw HttpsError
  },
  async (request) => {
    // 1. Validate authentication and authorization
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to create an employee.');
    }
    
    // 2. Extract data (already validated by Zod)
    const { email, password, companyId, ...employeeData } = request.data;
    
    // 3. Verify that the caller is an admin or manager of the company
    const adminUid = request.auth.uid;
    const adminUserDoc = await db.collection('users').doc(adminUid).get();
    const adminUserData = adminUserDoc.data();
    
    if (!adminUserDoc.exists || adminUserData?.companyId !== companyId || !['admin', 'manager'].includes(adminUserData?.role)) {
        throw new HttpsError('permission-denied', 'You do not have permission to add employees to this company.');
    }

    let newUser;
    try {
        // 4. Create the Firebase Auth user
        newUser = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: employeeData.name,
        });

        // 5. Create the user profile document in the /users collection
        const userProfile = {
            uid: newUser.uid,
            name: employeeData.name,
            email: email,
            role: employeeData.role,
            companyId: companyId,
            employeeId: employeeData.id,
        };
        await db.collection('users').doc(newUser.uid).set(userProfile);

        // 6. Create the employee document in the company's subcollection
        const employeeRecord = {
            ...employeeData,
            userId: newUser.uid, // Link the employee record to the auth user
            email: email,
        };
        // The password should never be stored in Firestore
        delete (employeeRecord as any).password; 
        
        const employeeDocRef = db.collection('companies').doc(companyId).collection('employees').doc(employeeData.id);
        await employeeDocRef.set(employeeRecord);

        return { success: true, userId: newUser.uid };

    } catch (error: any) {
        // 7. Error handling and cleanup
        // If user creation succeeded but a Firestore write failed, delete the created user.
        if (newUser) {
            await admin.auth().deleteUser(newUser.uid);
        }
        
        // Log the detailed error on the server for debugging
        console.error('Error in createEmployeeAccount function:', error);

        // Throw a specific error back to the client
        if (error.code && error.code.startsWith('auth/')) {
            throw new HttpsError('invalid-argument', error.message);
        }
        throw new HttpsError('internal', `An unexpected error occurred while creating the employee. Please try again.`);
    }
  }
);
