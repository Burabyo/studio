'use server';

/**
 * @fileOverview Payslip generation AI agent.
 *
 * - generatePayslip - A function that handles the payslip generation process.
 * - GeneratePayslipInput - The input type for the generatePayslip function.
 * - GeneratePayslipOutput - The return type for the generatePayslip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePayslipInputSchema = z.object({
  companyName: z.string().describe('The name of the company issuing the payslip.'),
  companyTagline: z.string().describe('The tagline or header for the company.'),
  companyContact: z.string().describe('The contact information for the company.'),
  employeeName: z.string().describe('The name of the employee.'),
  employeeId: z.string().describe('The ID of the employee.'),
  jobTitle: z.string().describe('The job title of the employee.'),
  payPeriod: z.string().describe('The pay period for the payslip (e.g., Month, Year).'),
  grossPay: z.number().describe('The gross pay for the pay period.'),
  allowances: z.record(z.string(), z.number()).describe('A key-value object of allowances and their amounts.'),
  deductions: z.record(z.string(), z.number()).describe('A key-value object of deductions and their amounts.'),
  taxes: z.number().describe('The total taxes deducted for the pay period.'),
  netPay: z.number().describe('The net pay for the pay period.'),
  bankName: z.string().describe('The bank name of the employee.'),
  accountNumber: z.string().describe('The bank account number of the employee.'),
  recurringContributions: z.record(z.string(), z.number()).describe('A key-value object of recurring contributions (e.g., social security, health insurance) and their amounts.'),
  currency: z.string().describe('The currency code for the amounts (e.g., USD, RWF).'),
  currencySymbol: z.string().describe('The currency symbol (e.g., $, FRw).'),
});

export type GeneratePayslipInput = z.infer<typeof GeneratePayslipInputSchema>;

const GeneratePayslipOutputSchema = z.object({
  payslip: z.string().describe('The generated payslip in a readable format.'),
});

export type GeneratePayslipOutput = z.infer<typeof GeneratePayslipOutputSchema>;

export async function generatePayslip(input: GeneratePayslipInput): Promise<GeneratePayslipOutput> {
  return generatePayslipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePayslipPrompt',
  input: {schema: GeneratePayslipInputSchema},
  output: {schema: GeneratePayslipOutputSchema},
  prompt: `You are an expert HR assistant responsible for generating branded payslips for employees.

  Generate a professional, personalized payslip for the employee with the following information. The payslip should be easy to read and understand. All monetary values should be prefixed with the currency symbol '{{{currencySymbol}}}'.

  ==================================================
  {{companyName}}
  {{companyTagline}}
  ==================================================
  
  PAYSLIP FOR: {{payPeriod}}

  Employee Name: {{{employeeName}}}
  Employee ID: {{{employeeId}}}
  Job Title: {{{jobTitle}}}

  --------------------------------------------------
  INCOME
  --------------------------------------------------
  Gross Pay: {{{currencySymbol}}}{{{grossPay}}}

  Allowances:
  {{#each allowances}}
  - {{key}}: {{{../currencySymbol}}}{{{this}}}
  {{/each}}

  --------------------------------------------------
  DEDUCTIONS
  --------------------------------------------------
  Deductions:
  {{#each deductions}}
  - {{key}}: {{{../currencySymbol}}}{{{this}}}
  {{/each}}

  Recurring Contributions:
  {{#each recurringContributions}}
  - {{key}}: {{{../currencySymbol}}}{{{this}}}
  {{/each}}

  Taxes: {{{currencySymbol}}}{{{taxes}}}
  
  --------------------------------------------------
  SUMMARY
  --------------------------------------------------
  Net Pay: {{{currencySymbol}}}{{{netPay}}}

  Payment to:
  Bank Name: {{{bankName}}}
  Account Number: {{{accountNumber}}}

  ==================================================
  {{companyContact}}
  ==================================================
  `,
});

const generatePayslipFlow = ai.defineFlow(
  {
    name: 'generatePayslipFlow',
    inputSchema: GeneratePayslipInputSchema,
    outputSchema: GeneratePayslipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
