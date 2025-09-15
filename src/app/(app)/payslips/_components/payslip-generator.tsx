"use client";

import * as React from "react";
import { useEmployees } from "@/context/employee-context";
import { useTransactions, Transaction } from "@/context/transaction-context";
import { useCompany } from "@/hooks/useCompany";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useCurrency } from "@/context/currency-context";

import jsPDF from "jspdf";

export default function PayslipGenerator() {
  const { employees } = useEmployees();
  const { transactions } = useTransactions();
  const { company, loading: companyLoading } = useCurrency();
  const { user, role, employee } = useAuth();

  const isEmployee = role === "employee";
  const isManagerOrAdmin = role === "manager" || role === "admin";

  const [employeeId, setEmployeeId] = React.useState(
    isEmployee ? employee?.id || "" : ""
  );
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));

  const selected = React.useMemo(() => {
    if (isEmployee) return employee;
    return employees.find((e) => e.id === employeeId);
  }, [employees, employeeId, employee, isEmployee]);

  const txForMonth = React.useMemo(() => {
    if (!employeeId) return [];
    const [y, m] = month.split("-").map((n) => parseInt(n, 10));
    return transactions.filter((t: Transaction) => {
      if (t.employeeId !== employeeId) return false;
      if (t.status !== "Approved") return false;
      const d = t.date ? new Date(t.date) : new Date();
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [transactions, employeeId, month]);

  const totals = React.useMemo(() => {
    const acc = { Advance: 0, Loan: 0, Bonus: 0, Deduction: 0 };
    for (const t of txForMonth) acc[t.type] += Number(t.amount || 0);
    return acc;
  }, [txForMonth]);

  const gross = selected?.employmentType === "Monthly Salary" ? Number(selected?.salary || 0) : 0;
  const taxRate = company?.flatTaxRate || 0;
  const tax = (gross * taxRate) / 100;

  const contributions = (company?.recurringContributions || []).map((c: any) => ({
    name: c.name,
    amount: (gross * (c.percentage || 0)) / 100,
  }));
  const contributionsTotal = contributions.reduce((sum, c) => sum + c.amount, 0);

  const net = gross + totals.Bonus - totals.Advance - totals.Loan - totals.Deduction - tax - contributionsTotal;

  const canGenerate = !!selected && !companyLoading;

  const handleGeneratePDF = () => {
    if (!selected) return;

    try {
      const doc = new jsPDF();

      // Company Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(company?.payslipInfo?.companyName || "Company Name", 105, 20, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (company?.payslipInfo?.companyTagline)
        doc.text(company.payslipInfo.companyTagline, 105, 26, { align: "center" });
      if (company?.payslipInfo?.companyContact)
        doc.text(`Contact: ${company.payslipInfo.companyContact}`, 105, 32, { align: "center" });

      // Horizontal line
      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);

      // Employee Info Box
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Details", 14, 44);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${selected.name}`, 14, 50);
      doc.text(`Employee ID: ${selected.id}`, 14, 56);
      doc.text(`Month: ${month}`, 105, 50);
      doc.text(`Gross Salary: ${gross.toLocaleString()}`, 105, 56);

      // Transactions & Contributions Section
      let yPos = 70;
      const spacing = 8;

      const addLine = (label: string, amount: number, sign: "+" | "-") => {
        doc.setFont("helvetica", "normal");
        doc.text(label, 14, yPos);
        doc.text(`${sign} ${amount.toLocaleString()}`, 196, yPos, { align: "right" });
        yPos += spacing;
      };

      addLine("Bonus", totals.Bonus, "+");
      addLine("Advance", totals.Advance, "-");
      addLine("Loan", totals.Loan, "-");
      addLine("Deduction", totals.Deduction, "-");
      addLine(`Flat Tax (${taxRate}%)`, tax, "-");
      contributions.forEach(c => addLine(c.name, c.amount, "-"));

      // Net Pay Box
      yPos += 5;
      doc.setLineWidth(0.7);
      doc.rect(14, yPos, 182, 12);
      doc.setFont("helvetica", "bold");
      doc.text("Net Pay", 14, yPos + 8);
      doc.text(net.toLocaleString(), 196, yPos + 8, { align: "right" });

      // Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("This is a computer-generated payslip.", 14, yPos + 25);

      // Save & Print
      const fileName = `Payslip_${selected.name}_${month}.pdf`;
      doc.save(fileName);
      const blobUrl = doc.output("bloburl");
      const printWindow = window.open(blobUrl);
      if (printWindow) printWindow.print();

    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isManagerOrAdmin && (
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
        )}

        {isEmployee && (
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <Input type="text" value={selected?.name || ""} disabled />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button disabled={!canGenerate} onClick={handleGeneratePDF}>
            Generate & Print PDF
          </Button>
        </div>
      </div>

      {employeeId && (
        <div className="rounded-lg border p-4 bg-white shadow-md">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">Gross Salary</div>
            <div className="text-right">{gross.toLocaleString()}</div>
            <div className="font-medium text-green-700">Bonus</div>
            <div className="text-right text-green-700">+ {totals.Bonus.toLocaleString()}</div>
            <div className="font-medium text-yellow-700">Advance</div>
            <div className="text-right text-yellow-700">- {totals.Advance.toLocaleString()}</div>
            <div className="font-medium text-orange-700">Loan</div>
            <div className="text-right text-orange-700">- {totals.Loan.toLocaleString()}</div>
            <div className="font-medium text-red-700">Deduction</div>
            <div className="text-right text-red-700">- {totals.Deduction.toLocaleString()}</div>
            <div className="font-medium">Flat Tax ({taxRate}%)</div>
            <div className="text-right">- {tax.toLocaleString()}</div>
            {contributions.map((c) => (
              <React.Fragment key={c.name}>
                <div className="font-medium">{c.name}</div>
                <div className="text-right">- {c.amount.toLocaleString()}</div>
              </React.Fragment>
            ))}
            <div className="font-bold text-lg">Net Pay</div>
            <div className="text-right font-bold text-lg">{net.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
