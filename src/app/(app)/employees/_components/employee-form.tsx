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
import React from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  employeeId: z.string().min(1, "Employee ID is required."),
  jobTitle: z.string().min(2, "Job title is required."),
  employmentType: z.enum(["Monthly Salary", "Daily Wages"]),
  salary: z.coerce.number().min(0, "Salary/rate must be a positive number."),
  bankName: z.string().min(2, "Bank name is required."),
  accountNumber: z.string().min(5, "Account number is required."),
});

type EmployeeFormValues = z.infer<typeof formSchema>;

interface EmployeeFormProps {
    setDialogOpen: (open: boolean) => void;
    onSubmit: (values: any) => void;
    employee?: Employee | null;
}

export function EmployeeForm({ setDialogOpen, onSubmit, employee }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name || "",
      employeeId: employee?.id || "",
      jobTitle: employee?.jobTitle || "",
      employmentType: employee?.employmentType || "Monthly Salary",
      salary: employee?.salary || 0,
      bankName: employee?.bankName || "",
      accountNumber: employee?.accountNumber || "",
    },
  });

  React.useEffect(() => {
    form.reset(employee ? { ...employee, employeeId: employee.id } : {
      name: "",
      employeeId: "",
      jobTitle: "",
      employmentType: "Monthly Salary",
      salary: 0,
      bankName: "",
      accountNumber: "",
    });
  }, [employee, form]);

  const handleSubmit = (values: EmployeeFormValues) => {
    onSubmit({
      id: employee?.id || '', // Keep original ID for editing
      name: values.name,
      jobTitle: values.jobTitle,
      employmentType: values.employmentType,
      salary: values.salary,
      bankName: values.bankName,
      accountNumber: values.accountNumber,
    });
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
            name="employeeId"
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
                    ? "Monthly Salary ($)"
                    : "Daily Rate ($)"}
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
              <FormItem className="md:col-span-2">
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
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit">{employee ? 'Save Changes' : 'Add Employee'}</Button>
        </div>
      </form>
    </Form>
  );
}
