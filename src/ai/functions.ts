
/**
 * @fileoverview Firebase Functions for PayPulse backend operations.
 */
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the Firebase Admin SDK.
// This must be done ONCE for all functions in this file.
// We check if the app is already initialized to prevent errors during hot-reloading.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = getFirestore();

/**
 * Creates a new Firebase Auth user and corresponding Firestore documents for an employee.
 * This function is callable from the client and ensures secure account creation.
 */
export const createEmployeeAccount = onCall(async (request) => {
  // 1. Validate authentication and authorization
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to create an employee.');
  }

  // 2. Validate incoming data
  const { email, password, companyId, ...employeeData } = request.data;

  if (!email || !password || !companyId || !employeeData.id) {
    throw new HttpsError('invalid-argument', 'Missing required data: email, password, companyId, and employee ID.');
  }
  
  // Verify that the caller is an admin or manager of the company they are trying to add to.
  const adminUid = request.auth.uid;
  const adminUserDoc = await db.collection('users').doc(adminUid).get();
  const adminUserData = adminUserDoc.data();
  
  if (!adminUserDoc.exists || adminUserData?.companyId !== companyId || !['admin', 'manager'].includes(adminUserData?.role)) {
      throw new HttpsError('permission-denied', 'You do not have permission to add employees to this company.');
  }


  let newUser;
  try {
    // 3. Create the Firebase Auth user
    newUser = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: employeeData.name,
    });

    // 4. Create the user profile document in the /users collection
    const userProfile = {
      uid: newUser.uid,
      name: employeeData.name,
      email: email,
      role: employeeData.role,
      companyId: companyId,
      employeeId: employeeData.id,
    };
    await db.collection('users').doc(newUser.uid).set(userProfile);

    // 5. Create the employee document in the company's subcollection
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
    // 6. Error handling and cleanup
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
    throw new HttpsError('internal', `An unexpected error occurred: ${error.message}`);
  }
});
