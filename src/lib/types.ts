export type Employee = {
  id: string;
  name: string;
  jobTitle: string;
  employmentType: "Monthly Salary" | "Daily Wages";
  bankName: string;
  accountNumber: string;
  salary: number;
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