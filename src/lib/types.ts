
import type { User as FirebaseUser } from "firebase/auth";

export type Employee = {
  id: string; // This is the Employee ID, e.g., "EMP001"
  name: string;
  jobTitle: string;
  employmentType: "Monthly Salary" | "Daily Wages";
  bankName: string;
  accountNumber: string;
  salary: number;
  role: 'employee' | 'manager';
  userId: string | null; // Link to Firebase Auth UID
  email: string; // The employee's login email
};

export type Transaction = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: 'Loan' | 'Advance' | 'Bonus' | 'Deduction';
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
};

export interface Company {
  id: string;
  name: string;
  currency: 'USD' | 'RWF';
  taxRate: number;
  recurringContributions: RecurringContribution[];
  payslipInfo: PayslipInfo;
}

export interface RecurringContribution {
  id:string; // Use a unique ID for each contribution
  name: string;
  percentage: number;
}

export interface PayslipInfo {
    companyName: string;
    companyTagline: string;
    companyContact: string;
}

export type User = {
    uid: string;
    email: string | null;
    name: string | null;
    role: 'admin' | 'manager' | 'employee';
    companyId: string | null;
    employeeId: string;
    firebaseUser: FirebaseUser | null;
}
