"use client";

import * as React from "react";
import { useEmployees } from "@/context/employee-context";
import { useTransactions } from "@/context/transaction-context";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PayslipGenerator() {
  const { employees } = useEmployees();
  const { transactions } = useTransactions();

  const [employeeId, setEmployeeId] = React.useState("");
  const [month, setMonth] = React.useState<string>(new Date().toISOString().slice(0, 7)); // yyyy-mm

  const selected = React.useMemo(() => employees.find((e) => e.id === employeeId), [employees, employeeId]);

  const txForMonth = React.useMemo(() => {
    if (!employeeId) return [];
    const [y, m] = month.split("-").map((n) => parseInt(n, 10));
    return transactions.filter((t) => {
      if (t.employeeId !== employeeId) return false;
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [transactions, employeeId, month]);

  const totals = React.useMemo(() => {
    const acc = { payment: 0, advance: 0, reimbursement: 0, deduction: 0 };
    for (const t of txForMonth) acc[t.type] += Number(t.amount || 0);
    return acc;
  }, [txForMonth]);

  const gross = selected?.employmentType === "Monthly Salary" ? Number(selected?.salary || 0) : 0;
  const net = gross + totals.reimbursement + totals.payment - totals.advance - totals.deduction;

  // ------------------------------
  // PDF & Print handler
  // ------------------------------
  const handleGeneratePDF = () => {
    if (!selected) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(`Payslip for ${selected.name}`, 14, 20);

    // Employee info
    doc.setFontSize(12);
    doc.text(`Employee ID: ${selected.id}`, 14, 30);
    doc.text(`Month: ${month}`, 14, 36);
    doc.text(`Gross Salary: ${gross.toLocaleString()}`, 14, 42);
    doc.text(`Net Pay: ${net.toLocaleString()}`, 14, 48);

    // Transactions table
    autoTable(doc, {
      startY: 55,
      head: [["Date", "Type", "Amount", "Notes"]],
      body: txForMonth.map((t) => [
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-",
        t.type,
        t.amount.toLocaleString(),
        t.notes || "-",
      ]),
    });

    // Save PDF
    const fileName = `Payslip_${selected.name}_${month}.pdf`;
    doc.save(fileName);

    // Optional: print immediately
    const blobUrl = doc.output("bloburl");
    const printWindow = window.open(blobUrl);
    if (printWindow) printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Employee selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Employee</label>
          <Select onValueChange={setEmployeeId} value={employeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} ({e.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>

        {/* Generate PDF button */}
        <div className="flex items-end">
          <Button disabled={!employeeId} onClick={handleGeneratePDF}>
            Generate & Print PDF
          </Button>
        </div>
      </div>

      {/* Payslip preview */}
      {employeeId && (
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-2">
            <div>Gross Salary</div>
            <div className="text-right">{gross.toLocaleString()}</div>
            <div>Payments</div>
            <div className="text-right">+ {totals.payment.toLocaleString()}</div>
            <div>Reimbursements</div>
            <div className="text-right">+ {totals.reimbursement.toLocaleString()}</div>
            <div>Advances</div>
            <div className="text-right">- {totals.advance.toLocaleString()}</div>
            <div>Deductions</div>
            <div className="text-right">- {totals.deduction.toLocaleString()}</div>
            <div className="font-semibold">Net Pay</div>
            <div className="text-right font-semibold">{net.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
