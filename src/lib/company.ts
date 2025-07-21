
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import type { Company } from "./types";

/**
 * Creates a new company document in Firestore with default values.
 * @param companyName The name of the new company.
 * @returns An object containing the new company's ID.
 */
export async function createNewCompany(companyName: string): Promise<{ companyId: string }> {
  // Generate a new document reference with a unique ID in the "companies" collection.
  const newCompanyRef = doc(collection(db, "companies"));
  const companyId = newCompanyRef.id;

  // Define the default data for the new company.
  const companyData: Company = {
    id: companyId,
    name: companyName,
    currency: 'USD',
    taxRate: 20,
    recurringContributions: [
      { id: 'pension', name: 'Pension Fund', percentage: 5 }
    ],
    payslipInfo: {
      companyName: companyName,
      companyTagline: `Payroll for ${companyName}`,
      companyContact: `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`
    }
  };

  // Set the data for the new company document.
  await setDoc(newCompanyRef, companyData);

  return { companyId };
}
