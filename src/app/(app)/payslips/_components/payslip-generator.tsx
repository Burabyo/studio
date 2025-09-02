"use client";

import * as React from "react";
import { useEmployees } from "@/context/employee-context";
import { useTransactions } from "@/context/transaction-context";
import { useCompany } from "@/hooks/useCompany";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PayslipGenerator() {
  const { employees } = useEmployees();
  const { transactions } = useTransactions();
  const { company, loading: companyLoading } = useCompany("IfKZoIghOA84Nk8ikrFM");

  const [employeeId, setEmployeeId] = React.useState("");
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));

  const selected = React.useMemo(
    () => employees.find((e) => e.id === employeeId),
    [employees, employeeId]
  );

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

  // NEW: tax & contributions
  const taxRate = company?.flatTaxRate || 0;
  const tax = (gross * taxRate) / 100;

  const contributions = (company?.recurringContributions || []).map((c: any) => ({
    name: c.name,
    amount: (gross * (c.percentage || 0)) / 100,
  }));
  const contributionsTotal = contributions.reduce((sum, c) => sum + c.amount, 0);

  const net =
    gross +
    totals.reimbursement +
    totals.payment -
    totals.advance -
    totals.deduction -
    tax -
    contributionsTotal;

  const canGenerate = !companyLoading && selected && company;

  const handleGeneratePDF = () => {
    if (!selected || !company) return;

    try {
      const doc = new jsPDF();

      // Company info
      doc.setFontSize(16);
      doc.text(company.payslipInfo?.companyName || "Company Name", 14, 20);
      if (company.payslipInfo?.companyTagline) doc.setFontSize(10).text(company.payslipInfo.companyTagline, 14, 25);
      if (company.payslipInfo?.companyContact)
        doc.setFontSize(10).text(`Contact: ${company.payslipInfo.companyContact}`, 14, 30);

      // Title
      doc.setFontSize(14);
      doc.text(`Payslip for ${selected.name}`, 14, 40);

      // Employee info
      doc.setFontSize(12);
      doc.text(`Employee ID: ${selected.id}`, 14, 48);
      doc.text(`Month: ${month}`, 14, 54);
      doc.text(`Gross Salary: ${gross.toLocaleString()}`, 14, 60);

      // Transactions + tax + contributions
      autoTable(doc, {
        startY: 68,
        head: [["Description", "Amount"]],
        body: [
          ["Gross Salary", gross.toLocaleString()],
          ["Payments", totals.payment.toLocaleString()],
          ["Reimbursements", totals.reimbursement.toLocaleString()],
          ["Advances", `- ${totals.advance.toLocaleString()}`],
          ["Deductions", `- ${totals.deduction.toLocaleString()}`],
          ["Flat Tax (" + taxRate + "%)", `- ${tax.toLocaleString()}`],
          ...contributions.map((c) => [c.name, `- ${c.amount.toLocaleString()}`]),
          ["Net Pay", net.toLocaleString()],
        ],
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 72;

      // Footer
      doc.setFontSize(10);
      doc.text("This is a computer-generated payslip.", 14, finalY + 10);

      // Save PDF
      const fileName = `Payslip_${selected.name}_${month}.pdf`;
      doc.save(fileName);

      // Optional: print immediately
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

        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>

        <div className="flex items-end">
          <Button disabled={!canGenerate} onClick={handleGeneratePDF}>
            Generate & Print PDF
          </Button>
        </div>
      </div>

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
            <div>Flat Tax ({taxRate}%)</div>
            <div className="text-right">- {tax.toLocaleString()}</div>
            {contributions.map((c) => (
              <React.Fragment key={c.name}>
                <div>{c.name}</div>
                <div className="text-right">- {c.amount.toLocaleString()}</div>
              </React.Fragment>
            ))}
            <div className="font-semibold">Net Pay</div>
            <div className="text-right font-semibold">{net.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
