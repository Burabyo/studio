
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

// Define the schema for the incoming request body
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

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    // In a deployed environment, you would use service account credentials
    // For local development or environments where GOOGLE_APPLICATION_CREDENTIALS is set,
    // initializeApp() can be called without arguments.
    // Ensure your environment is set up correctly for this to work.
    admin.initializeApp();
}
const db = getFirestore();

// This is the API route handler
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token.' }, { status: 401 });
    }
    const adminUid = decodedToken.uid;

    // 2. Validate Request Body
    const body = await req.json();
    const validationResult = createEmployeeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { email, password, companyId, ...employeeData } = validationResult.data;

    // 3. Verify Authorization (Caller is an admin/manager of the correct company)
    const adminUserDoc = await db.collection('users').doc(adminUid).get();
    const adminUserData = adminUserDoc.data();
    
    if (!adminUserDoc.exists || adminUserData?.companyId !== companyId || !['admin', 'manager'].includes(adminUserData?.role)) {
      return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
    }
    
    // 4. Execute Business Logic
    let newUser;
    try {
        // Create the Firebase Auth user
        newUser = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: employeeData.name,
        });

        // Create the user profile document in the /users collection
        const userProfile = {
            uid: newUser.uid,
            name: employeeData.name,
            email: email,
            role: employeeData.role,
            companyId: companyId,
            employeeId: employeeData.id,
        };
        await db.collection('users').doc(newUser.uid).set(userProfile);

        // Create the employee document in the company's subcollection
        const employeeRecord = {
            ...employeeData,
            userId: newUser.uid,
            email: email,
        };
        
        const employeeDocRef = db.collection('companies').doc(companyId).collection('employees').doc(employeeData.id);
        await employeeDocRef.set(employeeRecord);

        return NextResponse.json({ success: true, userId: newUser.uid }, { status: 201 });

    } catch (error: any) {
        // Cleanup: If user creation succeeded but Firestore failed, delete the user.
        if (newUser) {
            await admin.auth().deleteUser(newUser.uid).catch(e => console.error("Cleanup failed:", e));
        }

        console.error('Error creating employee:', error);
        
        if (error.code && error.code.startsWith('auth/')) {
            return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict or Invalid Argument
        }
        
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
  } catch (e: any) {
      console.error('Unhandled error in API route:', e);
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
