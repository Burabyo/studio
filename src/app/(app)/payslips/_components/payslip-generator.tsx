
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronsUpDown, Loader2, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useEmployeeContext } from "@/context/employee-context";
import { useTransactionContext } from "@/context/transaction-context";
import { useCurrency } from "@/context/currency-context";
import { generatePayslipText, type PayslipData } from "@/lib/payslip";
import { toast } from "@/hooks/use-toast";
import { downloadPdf } from "@/lib/pdf";

const payslipSchema = z.object({
  employeeId: z.string({ required_error: "Please select an employee." }),
});

type PayslipFormValues = z.infer<typeof payslipSchema>;

export function PayslipGenerator() {
  const { user } = useAuth();
  const { employees } = useEmployeeContext();
  const { transactions } = useTransactionContext();
  const { company, getCurrencySymbol } = useCurrency();

  const [isLoading, setIsLoading] = useState(false);
  const [generatedPayslip, setGeneratedPayslip] = useState<string | null>(null);

  const form = useForm<PayslipFormValues>({
    resolver: zodResolver(payslipSchema),
    defaultValues: {
      employeeId: "",
    },
  });

  const selectedEmployeeId = form.watch("employeeId");
  
  const availableEmployees = user?.role === 'employee' ? employees.filter(e => e.id === user.employeeId) : employees;

  useEffect(() => {
    // If user is an employee, auto-select them.
    if (user?.role === 'employee' && user.employeeId) {
      form.setValue('employeeId', user.employeeId, { shouldValidate: true });
    }
     // When the selected employee changes, clear the old payslip.
    setGeneratedPayslip(null);
  }, [user, form, selectedEmployeeId]);
  
  const onSubmit = async (values: PayslipFormValues) => {
    setIsLoading(true);
    setGeneratedPayslip(null);

    if (!company) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company settings not loaded.",
      });
      setIsLoading(false);
      return;
    }

    const employee = employees.find((e) => e.id === values.employeeId);
    if (!employee) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected employee not found.",
      });
      setIsLoading(false);
      return;
    }

    // Simulate a short delay to provide user feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate earnings and deductions for the current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const bonuses = transactions
        .filter(t => t.employeeId === employee.id && t.type === 'Bonus' && t.status === 'Paid' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
        .reduce((acc, t) => acc + t.amount, 0);

    const advances = transactions
        .filter(t => t.employeeId === employee.id && (t.type === 'Advance' || t.type === 'Loan') && t.status === 'Paid' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
        .reduce((acc, t) => acc + t.amount, 0);
    
    const otherDeductions = transactions
        .filter(t => t.employeeId === employee.id && t.type === 'Deduction' && t.status === 'Approved' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
        .reduce((acc, t) => acc + t.amount, 0);


    const grossPay = employee.salary + bonuses;
    const taxAmount = (grossPay * company.taxRate) / 100;
    
    const contributionAmounts = company.recurringContributions.reduce((acc, contrib) => {
      acc[contrib.name] = (grossPay * contrib.percentage) / 100;
      return acc;
    }, {} as Record<string, number>);

    const totalContributions = Object.values(contributionAmounts).reduce((sum, amount) => sum + amount, 0);
    const totalDeductions = advances + otherDeductions + totalContributions + taxAmount;
    const netPay = grossPay - totalDeductions;
    
    const payslipData: PayslipData = {
      companyName: company.payslipInfo.companyName,
      companyTagline: company.payslipInfo.companyTagline,
      companyContact: company.payslipInfo.companyContact,
      employeeName: employee.name,
      employeeId: employee.id,
      jobTitle: employee.jobTitle,
      payPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      grossPay: grossPay,
      allowances: { Bonus: bonuses },
      deductions: { 'Advances/Loans': advances, 'Other Deductions': otherDeductions },
      taxes: taxAmount,
      netPay: netPay,
      bankName: employee.bankName,
      accountNumber: employee.accountNumber,
      recurringContributions: contributionAmounts,
      currencySymbol: getCurrencySymbol(),
    };
    
    try {
        const result = generatePayslipText(payslipData);
        setGeneratedPayslip(result);
    } catch (error) {
        console.error("Error generating payslip:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: "An unexpected error occurred while generating the payslip.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (generatedPayslip && selectedEmployeeId) {
      const filename = `Payslip_${selectedEmployeeId}_${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.pdf`;
      downloadPdf(generatedPayslip, filename);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Generate Payslip</CardTitle>
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
                                disabled={user?.role === 'employee'}
                            >
                                {field.value
                                ? availableEmployees.find(
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
                                {availableEmployees.map((employee) => (
                                    <CommandItem
                                    value={employee.name}
                                    key={employee.id}
                                    onSelect={() => {
                                        form.setValue("employeeId", employee.id, { shouldValidate: true })
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
             
              <Button type="submit" disabled={isLoading || !selectedEmployeeId} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate Payslip
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generated Payslip</CardTitle>
            <CardDescription>Review the generated payslip below. You can print or download it as a PDF.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] bg-muted/50 rounded-md p-4 whitespace-pre-wrap font-mono text-sm overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isLoading && !generatedPayslip && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Your generated payslip will appear here.</p>
              </div>
            )}
            {!isLoading && generatedPayslip && (
              <code>{generatedPayslip}</code>
            )}
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleDownload} disabled={!generatedPayslip || isLoading}>
              <Printer className="mr-2 h-4 w-4" />
              Print / Download PDF
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}
