"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, PlusCircle, Trash2, Sparkles, FileText } from "lucide-react";
import { generatePayslip } from "@/ai/flows/generate-payslip";
import { toast } from "@/hooks/use-toast";

const payslipSchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  payPeriod: z.string().min(1, "Pay period is required"),
  grossPay: z.coerce.number().positive("Gross pay must be positive"),
  allowances: z.array(z.object({ name: z.string().min(1), amount: z.coerce.number().min(0) })).default([]),
  deductions: z.array(z.object({ name: z.string().min(1), amount: z.coerce.number().min(0) })).default([]),
  taxes: z.coerce.number().min(0, "Taxes cannot be negative"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  recurringContributions: z.array(z.object({ name: z.string().min(1), amount: z.coerce.number().min(0) })).default([]),
}).refine(data => {
    const totalAllowances = data.allowances.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductions = data.deductions.reduce((sum, item) => sum + item.amount, 0);
    const totalContributions = data.recurringContributions.reduce((sum, item) => sum + item.amount, 0);
    return data.grossPay + totalAllowances - totalDeductions - totalContributions - data.taxes >= 0;
}, {
    message: "Net pay cannot be negative.",
    path: ["grossPay"],
});


type PayslipFormValues = z.infer<typeof payslipSchema>;

export function PayslipGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPayslip, setGeneratedPayslip] = useState<string | null>(null);

  const form = useForm<PayslipFormValues>({
    resolver: zodResolver(payslipSchema),
    defaultValues: {
      employeeName: "Alice Johnson",
      employeeId: "EMP001",
      jobTitle: "Software Engineer",
      payPeriod: "June 2024",
      grossPay: 75000,
      taxes: 15000,
      bankName: "Equity Bank",
      accountNumber: "1234567890",
      allowances: [{ name: "Housing", amount: 5000 }, { name: "Transport", amount: 2000 }],
      deductions: [{ name: "Loan Repayment", amount: 10000 }],
      recurringContributions: [{ name: "Pension Fund", amount: 3000 }],
    },
  });

  const { fields: allowances, append: appendAllowance, remove: removeAllowance } = useFieldArray({ control: form.control, name: "allowances" });
  const { fields: deductions, append: appendDeduction, remove: removeDeduction } = useFieldArray({ control: form.control, name: "deductions" });
  const { fields: contributions, append: appendContribution, remove: removeContribution } = useFieldArray({ control: form.control, name: "recurringContributions" });

  async function onSubmit(data: PayslipFormValues) {
    setIsLoading(true);
    setGeneratedPayslip(null);
    try {
        const totalAllowances = data.allowances.reduce((sum, item) => sum + item.amount, 0);
        const totalDeductions = data.deductions.reduce((sum, item) => sum + item.amount, 0);
        const totalContributions = data.recurringContributions.reduce((sum, item) => sum + item.amount, 0);
        const netPay = data.grossPay + totalAllowances - totalDeductions - data.taxes - totalContributions;

        const input = {
            ...data,
            allowances: data.allowances.reduce((obj, item) => ({...obj, [item.name]: item.amount}), {}),
            deductions: data.deductions.reduce((obj, item) => ({...obj, [item.name]: item.amount}), {}),
            recurringContributions: data.recurringContributions.reduce((obj, item) => ({...obj, [item.name]: item.amount}), {}),
            netPay: netPay
        }

        const result = await generatePayslip(input);
        setGeneratedPayslip(result.payslip);
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "An error occurred while generating the payslip.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Payslip Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="employeeName" render={({ field }) => <FormItem><FormLabel>Employee Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="employeeId" render={({ field }) => <FormItem><FormLabel>Employee ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="jobTitle" render={({ field }) => <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="payPeriod" render={({ field }) => <FormItem><FormLabel>Pay Period</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="grossPay" render={({ field }) => <FormItem><FormLabel>Gross Pay ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="taxes" render={({ field }) => <FormItem><FormLabel>Taxes ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="bankName" render={({ field }) => <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
              </div>
              
              <Separator/>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Allowances</h3>
                {allowances.map((field, index) => (<div key={field.id} className="flex gap-2 mb-2 items-center"><Input {...form.register(`allowances.${index}.name`)} placeholder="Name" /><Input type="number" {...form.register(`allowances.${index}.amount`)} placeholder="Amount" /><Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(index)}><Trash2 className="h-4 w-4"/></Button></div>))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendAllowance({name: '', amount: 0})}><PlusCircle className="mr-2 h-4 w-4"/>Add Allowance</Button>
              </div>

              <Separator/>

              <div>
                <h3 className="text-lg font-medium mb-2">Deductions</h3>
                {deductions.map((field, index) => (<div key={field.id} className="flex gap-2 mb-2 items-center"><Input {...form.register(`deductions.${index}.name`)} placeholder="Name" /><Input type="number" {...form.register(`deductions.${index}.amount`)} placeholder="Amount" /><Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(index)}><Trash2 className="h-4 w-4"/></Button></div>))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendDeduction({name: '', amount: 0})}><PlusCircle className="mr-2 h-4 w-4"/>Add Deduction</Button>
              </div>

              <Separator/>

              <div>
                <h3 className="text-lg font-medium mb-2">Recurring Contributions</h3>
                {contributions.map((field, index) => (<div key={field.id} className="flex gap-2 mb-2 items-center"><Input {...form.register(`recurringContributions.${index}.name`)} placeholder="Name" /><Input type="number" {...form.register(`recurringContributions.${index}.amount`)} placeholder="Amount" /><Button type="button" variant="ghost" size="icon" onClick={() => removeContribution(index)}><Trash2 className="h-4 w-4"/></Button></div>))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendContribution({name: '', amount: 0})}><PlusCircle className="mr-2 h-4 w-4"/>Add Contribution</Button>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate with AI
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="lg:sticky top-6">
        <CardHeader>
          <CardTitle>Generated Payslip</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Generating your payslip...</p>
            </div>
          )}
          {generatedPayslip && (
            <div>
                 <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">{generatedPayslip}</pre>
                 <Button className="w-full mt-4">
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                 </Button>
            </div>
          )}
           {!isLoading && !generatedPayslip && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="h-16 w-16 text-muted" />
              <p className="mt-4 text-muted-foreground">Your generated payslip will appear here.</p>
              <p className="text-sm text-muted-foreground">Fill out the form and click "Generate with AI".</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
