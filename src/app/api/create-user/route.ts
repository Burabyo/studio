import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email, password, name, role, companyName } = data;

    // 1️⃣ Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // 2️⃣ Save employee/manager info in Firestore
    const db = admin.firestore();
    await db.collection("employees").doc(userRecord.uid).set({
      name,
      email,
      role,
      companyName,
      authUid: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}
