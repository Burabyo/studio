// ...existing imports and setup remain unchanged

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
      companyId, // ✅ NEW: accept companyId from frontend
    } = req.body;

    // Validate required fields including companyId
    const requiredFields = {
      fullName,
      employeeId,
      jobTitle,
      role,
      employmentType,
      salary,
      bankName,
      bankAccountNumber,
      companyId, // ✅ NEW: required
    };

    // Only require email and password for new employees
    const isNewEmployee = !req.body.existing;
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
      if (isNewEmployee) {
        // ...duplicate checks remain unchanged

        await admin.auth().createUser({
          email,
          password,
          displayName: fullName,
        });
      }

      // Create or update employee document in Firestore
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
          companyId, // ✅ NEW: store companyId in employee doc
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
