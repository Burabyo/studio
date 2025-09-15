"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Banknote, FileText } from "lucide-react";
import { PayrollChart } from "./_components/payroll-chart";
import { useEmployees } from "@/context/employee-context";
import { useTransactions } from "@/context/transaction-context";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";
import { MainSidebar } from "@/components/main-sidebar";

export default function DashboardPage() {
  const { employee, loading: authLoading, role, user } = useAuth(); // ✅ added user from auth-context
  const { employees = [], loading: empLoading } = useEmployees();
  const { transactions = [], loading: txLoading } = useTransactions();
  const { formatCurrency } = useCurrency();

  // Show loading while any data is loading
  if (authLoading || empLoading || txLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Loading dashboard...</p>
      </div>
    );
  }

  // ✅ Protect dashboard: block only if no authenticated user OR no valid role
  if (!user || !role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">
          Please log in to view the dashboard.
        </p>
      </div>
    );
  }

  // ✅ Role checks
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isEmployee = role === "employee";

  // Employees visible
  const visibleEmployees = isAdmin
    ? employees // Admin sees everyone
    : isManager
    ? employees // Manager sees all in their company
    : employee
    ? [employee] // Employee sees themselves
    : [];

  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Compute totals safely
  const totalPayroll = visibleEmployees.reduce((sum, emp) => {
    return emp.employmentType === "Monthly Salary"
      ? sum + (emp.salary || 0)
      : sum;
  }, 0);

  const pendingAdvances = transactions.reduce((sum, t) => {
    if (isAdmin || isManager) {
      return t.type === "advance" && t.amount ? sum + t.amount : sum;
    }
    return t.type === "advance" && t.amount && t.employeeId === employee?.id
      ? sum + t.amount
      : sum;
  }, 0);

  const pendingAdvancesCount = transactions.filter(
    (t) =>
      t.type === "advance" &&
      (isAdmin || isManager || t.employeeId === employee?.id)
  ).length;

  const payslipsGenerated = visibleEmployees.length;

  return (
    <div className="flex">
      {/* Sidebar */}
      <MainSidebar />

      {/* Main content */}
      <main className="flex-1 p-6 bg-background min-h-screen">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back,{" "}
            {isAdmin ? "Admin" : employee?.name || user?.displayName}.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="flex flex-col justify-between min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <div className="text-2xl font-bold break-words truncate">
                {visibleEmployees.length}
              </div>
              <p className="text-xs text-muted-foreground">
                managed in the system
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payroll
              </CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <div className="text-2xl font-bold break-words truncate">
                {formatCurrency(totalPayroll)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly base salary total
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Advances Pending
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <div className="text-2xl font-bold break-words truncate">
                {formatCurrency(pendingAdvances)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {pendingAdvancesCount}{" "}
                {isAdmin || isManager ? "employees" : "your records"}
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Payslips Generated
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col justify-between">
              <div className="text-2xl font-bold break-words truncate">
                {payslipsGenerated}
              </div>
              <p className="text-xs text-muted-foreground">
                For {currentMonth}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
