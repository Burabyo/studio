// index.js
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Import onRequest from v2
const { onRequest } = require("firebase-functions/v2/https");

// Export the function using onRequest
exports.createEmployeeAccount = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({ error: "Method not allowed, use POST" });
    }

    const {
      fullName,
      employeeId,
      email,
      password,
      jobTitle,
      role,
      employmentType,
      salary,
      bankName,
      bankAccountNumber,
      companyId,
    } = req.body;

    const requiredFields = {
      fullName,
      employeeId,
      jobTitle,
      role,
      employmentType,
      salary,
      bankName,
      bankAccountNumber,
      companyId,
    };

    const isNewEmployee = !req.body.existing;
    if (isNewEmployee) {
      requiredFields.email = email;
      requiredFields.password = password;
    }

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).send({ error: `${key} is required` });
      }
    }

    try {
      if (isNewEmployee) {
        await admin.auth().createUser({
          email,
          password,
          displayName: fullName,
        });
      }

      await db.collection("employees").doc(employeeId).set(
        {
          fullName,
          employeeId,
          email: email || null,
          password: password || null,
          jobTitle,
          role,
          employmentType,
          salary,
          bankName,
          bankAccountNumber,
          companyId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res
        .status(201)
        .send({ message: "Employee account created/updated successfully" });
    } catch (error) {
      console.error("Error creating employee:", error);
      return res.status(500).send({ error: "Internal server error" });
    }
  });
});
