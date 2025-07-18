
export type Employee = {
  id: string;
  name: string;
  jobTitle: string;
  employmentType: "Monthly Salary" | "Daily Wages";
  bankName: string;
  accountNumber: string;
  salary: number;
  role: 'employee' | 'manager';
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
  id: string; // Use a unique ID for each contribution
  name: string;
  percentage: number;
}

export interface PayslipInfo {
    companyName: string;
    companyTagline: string;
    companyContact: string;
}
