
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Banknote, FileText } from "lucide-react";
import { PayrollChart } from "./_components/payroll-chart";
import { useEmployeeContext } from "@/context/employee-context";
import { useTransactionContext } from "@/context/transaction-context";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { employees } = useEmployeeContext();
  const { transactions } = useTransactionContext();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalPayroll = employees.reduce((sum, emp) => {
    if (emp.employmentType === 'Monthly Salary') {
      return sum + emp.salary;
    }
    return sum;
  }, 0);

  const pendingAdvances = transactions.reduce((sum, t) => {
    if (t.type === 'Advance' && t.status === 'Pending') {
      return sum + t.amount;
    }
    return sum;
  }, 0);
  
  const pendingAdvancesCount = transactions.filter(t => t.type === 'Advance' && t.status === 'Pending').length;

  const payslipsGenerated = employees.length;

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name}. Here&apos;s your payroll at a glance.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">managed in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">Monthly base salary total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advances Pending</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAdvances)}</div>
            <p className="text-xs text-muted-foreground">Across {pendingAdvancesCount} employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payslips Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslipsGenerated}</div>
            <p className="text-xs text-muted-foreground">For {currentMonth}</p>
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

    </div>
  );
}
