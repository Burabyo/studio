const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // Allow requests from any origin

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Limit max instances to control costs
setGlobalOptions({ maxInstances: 10 });

/**
 * Create a new employee account
 * Expects JSON body exactly like your frontend:
 * {
 *   fullName, employeeId, email, password,
 *   jobTitle, role, employmentType, salary,
 *   bankName, bankAccountNumber
 * }
 */
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
    } = req.body;

    // Validate required fields
    const requiredFields = {
      fullName,
      employeeId,
      jobTitle,
      role,
      employmentType,
      salary,
      bankName,
      bankAccountNumber,
    };

    // Only require email and password for new employees
    const isNewEmployee = !req.body.existing; // flag from frontend if needed
    if (isNewEmployee) {
      requiredFields.email = email;
      requiredFields.password = password;
    }

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === "") {
        return res.status(400).send({ error: `${key} is required` });
      }
    }

    try {
      // Check for duplicates if new employee
      if (isNewEmployee) {
        const duplicateQuery = await db
          .collection("employees")
          .where("employeeId", "==", employeeId)
          .get();

        if (!duplicateQuery.empty) {
          return res
            .status(409)
            .send({ error: "Employee with this ID already exists" });
        }

        const emailQuery = await db
          .collection("employees")
          .where("email", "==", email)
          .get();

        if (!emailQuery.empty) {
          return res
            .status(409)
            .send({ error: "Employee with this email already exists" });
        }

        // ✅ Create Firebase Auth user for new employee
        await admin.auth().createUser({
          email,
          password,
          displayName: fullName,
        });
      }

      // Create or update employee document
      await db.collection("employees").doc(employeeId).set(
        {
          fullName,
          employeeId,
          email: email || null,
          password: password || null, // plain text as requested
          jobTitle,
          role,
          employmentType,
          salary,
          bankName,
          bankAccountNumber,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true } // merge allows updating existing employee without overwriting all fields
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
