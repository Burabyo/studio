"use client";

import React, { useState } from "react";
import { useEmployees } from "@/context/employee-context";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";
import { EmployeeForm, EmployeeFormValues } from "./employee-form";
import { Employee } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, PlusCircle } from "lucide-react";

export const EmployeeTable: React.FC = () => {
  const { employees, loading, addEmployee, editEmployee, deleteEmployee } = useEmployees();
  const { formatCurrency } = useCurrency();
  const { role: userRole } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const canManage = userRole === "admin" || userRole === "manager";
  const canDelete = userRole === "admin";

const handleSubmit = async (values: EmployeeFormValues) => {
  try {
    if (selectedEmployee) {
      await editEmployee(selectedEmployee.id, values);
    } else {
      await addEmployee(values); // userId can be null or added after Firebase Auth creation
    }
    setIsDialogOpen(false);
    setSelectedEmployee(null);
  } catch (err: any) {
    alert(err.message || "Error saving employee.");
  }
};



  const openNewDialog = () => {
    setSelectedEmployee(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(id);
    } catch (err: any) {
      alert(err.message || "Error deleting employee.");
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Employees</h2>
          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" /> Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{selectedEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  setDialogOpen={setIsDialogOpen}
                  employee={selectedEmployee}
                  onSubmit={handleSubmit}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Job Title</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Type</TableCell>
              <TableCell className="text-right">Salary/Rate</TableCell>
              {(canManage || canDelete) && <TableCell className="text-right">Actions</TableCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canManage || canDelete ? 7 : 6} className="text-center py-10">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage || canDelete ? 7 : 6} className="text-center py-10">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.id}</TableCell>
                  <TableCell>{emp.jobTitle}</TableCell>
                  <TableCell>
                    <Badge variant={emp.role === "admin" ? "destructive" : emp.role === "manager" ? "secondary" : "outline"}>
                      {emp.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.employmentType === "Monthly Salary" ? "secondary" : "outline"}>
                      {emp.employmentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {emp.salary != null
                      ? emp.employmentType === "Monthly Salary"
                        ? formatCurrency(emp.salary)
                        : `${formatCurrency(emp.salary)}/day`
                      : "-"}
                  </TableCell>
                  {(canManage || canDelete) && (
                    <TableCell className="text-right flex justify-end gap-2">
                      {canManage && (
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(emp as Employee)}>
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(emp.id)}>
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
