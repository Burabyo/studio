import { EmployeeTable } from "./_components/employee-table";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage your team members and their information.
        </p>
      </header>
      <EmployeeTable />
    </div>
  );
}
