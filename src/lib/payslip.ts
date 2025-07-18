export interface PayslipData {
  companyName: string;
  companyTagline: string;
  companyContact: string;
  employeeName: string;
  employeeId: string;
  jobTitle: string;
  payPeriod: string;
  grossPay: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  taxes: number;
  netPay: number;
  bankName: string;
  accountNumber: string;
  recurringContributions: Record<string, number>;
  currencySymbol: string;
}

function formatCurrency(value: number, symbol: string) {
  return `${symbol}${value.toFixed(2)}`;
}

function generateSection<T extends Record<string, number>>(
  title: string,
  items: T,
  symbol: string
): string[] {
  const lines: string[] = [];
  if (Object.values(items).some((v) => v > 0)) {
    lines.push(title);
    for (const [key, value] of Object.entries(items)) {
      if (value > 0) {
        lines.push(`- ${key}: ${formatCurrency(value, symbol)}`);
      }
    }
  }
  return lines;
}

export function generatePayslipText(data: PayslipData): string {
  const {
    companyName,
    companyTagline,
    companyContact,
    employeeName,
    employeeId,
    jobTitle,
    payPeriod,
    grossPay,
    allowances,
    deductions,
    taxes,
    netPay,
    bankName,
    accountNumber,
    recurringContributions,
    currencySymbol,
  } = data;
  
  const separator = "==================================================";
  const lineSeparator = "--------------------------------------------------";

  const content: string[] = [
    separator,
    companyName,
    companyTagline,
    separator,
    "",
    `PAYSLIP FOR: ${payPeriod}`,
    "",
    `Employee Name: ${employeeName}`,
    `Employee ID: ${employeeId}`,
    `Job Title: ${jobTitle}`,
    "",
    lineSeparator,
    "INCOME",
    lineSeparator,
    `Gross Pay: ${formatCurrency(grossPay, currencySymbol)}`,
    ...generateSection("Allowances:", allowances, currencySymbol),
    "",
    lineSeparator,
    "DEDUCTIONS",
    lineSeparator,
    ...generateSection("Deductions:", deductions, currencySymbol),
    ...generateSection("Recurring Contributions:", recurringContributions, currencySymbol),
    `Taxes: ${formatCurrency(taxes, currencySymbol)}`,
    "",
    lineSeparator,
    "SUMMARY",
    lineSeparator,
    `Net Pay: ${formatCurrency(netPay, currencySymbol)}`,
    "",
    "Payment to:",
    `Bank Name: ${bankName}`,
    `Account Number: ${accountNumber}`,
    "",
    separator,
    companyContact,
    separator,
  ];

  return content.join("\n");
}
