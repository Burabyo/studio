
"use client";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/lib/types";
import React, { useState } from "react";
import { useCurrency } from "@/context/currency-context";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const formSchema = z.object({
  id: z.string().min(1, "Employee ID is required."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email.").optional(),
  password: z.string().min(6, "Password must be at least 6 characters.").optional(),
  jobTitle: z.string().min(2, "Job title is required."),
  employmentType: z.enum(["Monthly Salary", "Daily Wages"]),
  salary: z.coerce.number().min(0, "Salary/rate must be a positive number."),
  bankName: z.string().min(2, "Bank name is required."),
  accountNumber: z.string().min(5, "Account number is required."),
  role: z.enum(["employee", "manager"]),
});

type EmployeeFormValues = z.infer<typeof formSchema>;

interface EmployeeFormProps {
    setDialogOpen: (open: boolean) => void;
    onSubmit: (values: any) => Promise<void>;
    employee?: Employee | null;
}

export function EmployeeForm({ setDialogOpen, onSubmit, employee }: EmployeeFormProps) {
  const { company } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema.refine(data => {
        // If it's a new employee, email and password are required.
        if (!employee) {
            return !!data.email && !!data.password;
        }
        return true;
    }, {
        message: "Email and password are required for new employees.",
        path: ["email"], // you can specify which field the error belongs to
    })),
    defaultValues: {
      id: employee?.id || `EMP-${uuidv4().substring(0, 4).toUpperCase()}`,
      name: employee?.name || "",
      jobTitle: employee?.jobTitle || "",
      employmentType: employee?.employmentType || "Monthly Salary",
      salary: employee?.salary || 0,
      bankName: employee?.bankName || "",
      accountNumber: employee?.accountNumber || "",
      role: employee?.role || "employee",
      email: employee?.email || "",
      password: "",
    },
  });

  React.useEffect(() => {
    form.reset(employee ? { ...employee, email: employee.email || '' } : {
      id: `EMP-${uuidv4().substring(0, 4).toUpperCase()}`,
      name: "",
      jobTitle: "",
      employmentType: "Monthly Salary",
      salary: 0,
      bankName: "",
      accountNumber: "",
      role: "employee",
      email: "",
      password: "",
    });
  }, [employee, form]);

  const handleSubmit = async (values: EmployeeFormValues) => {
    setIsSubmitting(true);
    await onSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID</FormLabel>
                <FormControl>
                  <Input placeholder="EMP007" {...field} disabled={!!employee} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!employee && (
            <>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="employee@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Monthly Salary">Monthly Salary</SelectItem>
                    <SelectItem value="Daily Wages">Daily Wages</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("employmentType") === "Monthly Salary"
                    ? `Monthly Salary (${company?.currency})`
                    : `Daily Rate (${company?.currency})`}
                </FormLabel>
                <FormControl>
                  <Input type="number" placeholder="5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                  <Input placeholder="Bank of Earth" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem className={employee ? "md:col-span-2" : ""}>
                <FormLabel>Bank Account Number</FormLabel>
                <FormControl>
                  <Input placeholder="1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {employee ? 'Save Changes' : 'Add Employee'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

