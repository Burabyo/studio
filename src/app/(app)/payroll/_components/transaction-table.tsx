"use client";

import React, { useState } from "react";
import { useTransactions, Transaction, useTransactionActions } from "@/context/transaction-context";
import { useEmployees } from "@/context/employee-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TransactionForm, TransactionFormValues } from "./transaction-form";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

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
    await deleteTransaction(id);
  };
const handleSubmit = async (values: TransactionFormValues) => {
  // Find the employee object to get the name
  const selectedEmployee = employees.find((e) => e.id === values.employeeId);

  if (!selectedEmployee) {
    console.error("Employee not found");
    return;
  }

  const typeMap: Record<string, Transaction["type"]> = {
  advance: "Advance",
  loan: "Loan",
  bonus: "Bonus",
  deduction: "Deduction",
};

const newTx: Omit<Transaction, "id" | "createdAt"> = {
  employeeId: values.employeeId,
  employeeName: selectedEmployee?.name || "Unknown",
  date: values.date || new Date().toISOString(),
  type: typeMap[values.type], // ✅ ensure capitalization
  amount: Number(values.amount),
  description: values.notes || "",
  status: values.status || "Pending",
};

  if (selectedTx) {
    await editTransaction(selectedTx.id, newTx);
  } else {
    await addTransaction(newTx);
  }

  setIsDialogOpen(false);
  setSelectedTx(null);
};


  const getStatusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-green-700 font-semibold";
      case "Denied":
        return "text-red-700 font-semibold";
      case "Pending":
        return "text-yellow-600 font-semibold";
      default:
        return "";
    }
  };

  return (
    <div className="overflow-x-auto">
      <Button className="mb-4" onClick={() => setIsDialogOpen(true)}>Add Transaction</Button>

      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-6 py-4 min-w-[120px]">Date</th>
            <th className="px-6 py-4 min-w-[150px]">Employee</th>
            <th className="px-6 py-4 min-w-[120px]">Type</th>
            <th className="px-6 py-4 min-w-[200px]">Description</th>
            <th className="px-6 py-4 min-w-[120px]">Status</th>
            <th className="px-6 py-4 min-w-[100px]">Amount</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="text-center py-6">Loading...</td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-6">No transactions found</td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-200">
                <td className="px-6 py-4">{tx.date ? format(new Date(tx.date), "dd/MM/yyyy") : "-"}</td>
                <td className="px-6 py-4">{employees.find(e => e.id === tx.employeeId)?.name || "Unknown"}</td>
                <td className="px-6 py-4">{tx.type}</td>
                <td className="px-6 py-4">{tx.description || "-"}</td>
                <td className={`px-6 py-4 ${getStatusClass(tx.status)}`}>{tx.status}</td>
                <td className="px-6 py-4">{tx.amount}</td>
                <td className="px-6 py-4 space-x-2">
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

          <TransactionForm
            transaction={selectedTx || undefined}
            onSubmit={handleSubmit}
            setDialogOpen={setIsDialogOpen}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
