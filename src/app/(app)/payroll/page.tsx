import { TransactionTable } from "./_components/transaction-table";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Track and manage employee loans, advances, and other payroll transactions.
        </p>
      </header>
      <TransactionTable />
    </div>
  );
}