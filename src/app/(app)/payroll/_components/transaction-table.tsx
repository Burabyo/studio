"use client";

import React, { useState } from "react";
import { useTransactions, Transaction, useTransactionActions } from "@/context/transaction-context";
import { useEmployees } from "@/context/employee-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface TransactionFormValues {
  id: string;
  employeeId: string;
  type: "advance" | "payment" | "reimbursement" | "deduction";
  amount: number;
  notes?: string;
}

export const TransactionTable: React.FC = () => {
  const { transactions, loading } = useTransactions();
  const { employees } = useEmployees();
  const { addTransaction, editTransaction, deleteTransaction } = useTransactionActions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const openEditDialog = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id); // ✅ delete from Firestore
  };

  const handleSubmit = async (values: TransactionFormValues) => {
    if (selectedTx) {
      // ✅ update Firestore
      await editTransaction(selectedTx.id, values);
    } else {
      // ✅ add to Firestore
      const newTx: Omit<Transaction, "id" | "createdAt"> = {
        employeeId: values.employeeId,
        type: values.type,
        amount: values.amount,
        notes: values.notes,
        status: "Pending",
      };
      await addTransaction(newTx);
    }
    setIsDialogOpen(false);
    setSelectedTx(null);
  };

  return (
    <div className="overflow-x-auto">
      <Button className="mb-4" onClick={() => setIsDialogOpen(true)}>Add Transaction</Button>

      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-8 py-4 min-w-[150px]">Employee</th>
            <th className="px-8 py-4 min-w-[120px]">Type</th>
            <th className="px-8 py-4 min-w-[100px]">Amount</th>
            <th className="px-8 py-4 min-w-[200px]">Notes</th>
            <th className="px-8 py-4 min-w-[160px]">Date</th>
            <th className="px-8 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-6">Loading...</td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-6">No transactions found</td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-200">
                <td className="px-8 py-6">{employees.find(e => e.id === tx.employeeId)?.name || "Unknown"}</td>
                <td className="px-8 py-6">{tx.type}</td>
                <td className="px-8 py-6">{tx.amount}</td>
                <td className="px-8 py-6">{tx.notes || "-"}</td>
                <td className="px-8 py-6">{tx.createdAt ? format(new Date(tx.createdAt), "dd/MM/yyyy") : "-"}</td>
                <td className="px-8 py-6 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(tx)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tx.id)}>Delete</Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTx ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit({
                id: selectedTx?.id || uuidv4(),
                employeeId: formData.get("employeeId") as string,
                type: formData.get("type") as TransactionFormValues["type"],
                amount: Number(formData.get("amount")),
                notes: formData.get("notes") as string,
              });
            }}
            className="space-y-4"
          >
            <Select name="employeeId" defaultValue={selectedTx?.employeeId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select name="type" defaultValue={selectedTx?.type || "advance"}>
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

            <Input type="number" name="amount" placeholder="Amount" defaultValue={selectedTx?.amount || 0} />
            <Input name="notes" placeholder="Notes (optional)" defaultValue={selectedTx?.notes || ""} />

            <DialogFooter>
              <Button type="submit">{selectedTx ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
