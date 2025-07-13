"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, FileText, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { generatePayslip } from "@/ai/flows/generate-payslip";
import { toast } from "@/hooks/use-toast";
import { employees as initialEmployees } from "../../employees/data";
import { transactions as initialTransactions } from "../../payroll/data";
import type { Employee, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

const payslipSchema = z.object({
  employeeId: z.string({ required_error: "Please select an employee." }),
});

type PayslipFormValues = z.infer<typeof payslipSchema>;

export function PayslipGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPayslip, setGeneratedPayslip] = useState<string | null>(null);
  const [employees] = useState<Employee[]>(initialEmployees);
  const [transactions] = useState<Transaction[]>(initialTransactions);

  const form = useForm<PayslipFormValues>({
    resolver: zodResolver(payslipSchema),
  });

  async function onSubmit(data: PayslipFormValues) {
    setIsLoading(true);
    setGeneratedPayslip(null);

    const employee = employees.find(e => e.id === data.employeeId);
    if (!employee) {
        toast({
            variant: "destructive",
            title: "Employee not found",
            description: "Could not find the selected employee's details.",
        });
        setIsLoading(false);
        return;
    }

    try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getUTCFullYear();
        const employeeTransactions = transactions.filter(t => 
            t.employeeId === employee.id && 
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear &&
            t.status === 'Approved' || t.status === 'Paid'
        );

        const allowances = employeeTransactions.filter(t => t.type === 'Bonus').reduce((acc, t) => ({...acc, [t.description]: t.amount}), {});
        const deductions = employeeTransactions.filter(t => t.type === 'Deduction' || t.type === 'Loan' || t.type === 'Advance').reduce((acc, t) => ({...acc, [t.description]: t.amount}), {});
        
        // Let's assume some defaults for now
        const taxes = employee.salary * 0.2; 
        const recurringContributions = { "Pension Fund": employee.salary * 0.05 };

        const totalAllowances = Object.values(allowances).reduce((sum: number, amount) => sum + (amount as number), 0);
        const totalDeductions = Object.values(deductions).reduce((sum: number, amount) => sum + (amount as number), 0);
        const totalContributions = Object.values(recurringContributions).reduce((sum, amount) => sum + amount, 0);

        const netPay = employee.salary + totalAllowances - totalDeductions - taxes - totalContributions;

        const input = {
            employeeName: employee.name,
            employeeId: employee.id,
            jobTitle: employee.jobTitle,
            payPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            grossPay: employee.salary,
            allowances,
            deductions,
            taxes,
            recurringContributions,
            netPay,
            bankName: employee.bankName,
            accountNumber: employee.accountNumber,
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
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>
            Choose an employee to generate a payslip based on their salary and recorded transactions for the current month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Employee</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value
                                ? employees.find(
                                    (employee) => employee.id === field.value
                                    )?.name
                                : "Select employee"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                            <CommandInput placeholder="Search employee..." />
                            <CommandList>
                                <CommandEmpty>No employee found.</CommandEmpty>
                                <CommandGroup>
                                {employees.map((employee) => (
                                    <CommandItem
                                    value={employee.name}
                                    key={employee.id}
                                    onSelect={() => {
                                        form.setValue("employeeId", employee.id)
                                    }}
                                    >
                                    {employee.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             
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
              <FileText className="h-16 w-16 text-muted" />
              <p className="mt-4 text-muted-foreground">Your generated payslip will appear here.</p>
              <p className="text-sm text-muted-foreground">Select an employee and click "Generate with AI".</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
