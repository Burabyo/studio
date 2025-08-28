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
  type: "advance" | "payment" | "reimbursement" | "deduction";
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
      type: "advance",
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
      onSubmit({ ...values, employeeName: selectedEmployee.name });
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4 border p-4 bg-white rounded shadow"
    >
      <Select
        onValueChange={(val) => form.setValue("employeeId", val)}
        defaultValue={form.getValues("employeeId")}
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

      <Select
        onValueChange={(val) => form.setValue("type", val as TransactionFormValues["type"])}
        defaultValue={form.getValues("type")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Transaction Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="advance">Advance</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
          <SelectItem value="reimbursement">Reimbursement</SelectItem>
          <SelectItem value="deduction">Deduction</SelectItem>
        </SelectContent>
      </Select>

      <Input type="number" placeholder="Amount" {...form.register("amount", { valueAsNumber: true })} />
      <Input placeholder="Notes (optional)" {...form.register("notes")} />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">{transaction ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
}
