"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEmployees, EmployeeWithId } from "@/context/employee-context";

export type TransactionFormValues = {
  employeeId: string;
  employeeName: string;
  type: "Advance" | "Loan" | "Bonus" | "Deduction";
  status: "Approved" | "Denied" | "Pending";
  date: string;
  amount: number;
  notes?: string;
};

interface TransactionFormProps {
  transaction?: TransactionFormValues;
  onSubmit: (values: TransactionFormValues) => void;
  setDialogOpen: (val: boolean) => void;
}

export function TransactionForm({ transaction, onSubmit, setDialogOpen }: TransactionFormProps) {
  const { employees } = useEmployees();

  const form = useForm<TransactionFormValues>({
    defaultValues: transaction || {
      employeeId: "",
      employeeName: "",
      type: "Advance",
      status: "Pending",
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset(transaction);
    }
  }, [transaction, form]);

  const handleSubmit = (values: TransactionFormValues) => {
    const selectedEmployee = employees.find((e) => e.id === values.employeeId);
    if (selectedEmployee) {
      // ✅ Ensure employeeName is always synced
      onSubmit({ ...values, employeeName: selectedEmployee.name });
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4 border p-4 bg-white rounded shadow"
    >
      {/* Employee */}
      <Select
        value={form.watch("employeeId")}
        onValueChange={(val) => form.setValue("employeeId", val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Employee" />
        </SelectTrigger>
        <SelectContent>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Transaction Date */}
      <Input
        type="date"
        {...form.register("date")}
        defaultValue={form.getValues("date")}
      />

      {/* Transaction Type */}
      <Select
        value={form.watch("type")}
        onValueChange={(val) => form.setValue("type", val as TransactionFormValues["type"])}
      >
        <SelectTrigger>
          <SelectValue placeholder="Transaction Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Advance">Advance Payment</SelectItem>
          <SelectItem value="Loan">Loan</SelectItem>
          <SelectItem value="Bonus">Bonus</SelectItem>
          <SelectItem value="Deduction">Deduction</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={form.watch("status")}
        onValueChange={(val) => form.setValue("status", val as TransactionFormValues["status"])}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Approved">Approved</SelectItem>
          <SelectItem value="Denied">Denied</SelectItem>
          <SelectItem value="Pending">Pending</SelectItem>
        </SelectContent>
      </Select>

      {/* Amount */}
      <Input
        type="number"
        placeholder="Amount"
        {...form.register("amount", { valueAsNumber: true })}
      />

      {/* Notes / Description */}
      <Input
        placeholder="Description"
        {...form.register("notes")}
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">{transaction ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
}
