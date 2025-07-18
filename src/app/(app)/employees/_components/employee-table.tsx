
"use client";

import * as React from "react";
import type { Employee } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmployeeForm } from "./employee-form";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useEmployeeContext } from "@/context/employee-context";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";

export function EmployeeTable() {
  const { employees, addEmployee, editEmployee, deleteEmployee, loading } = useEmployeeContext();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);

  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    await addEmployee(employee);
    toast({
      title: "Employee Added",
      description: `${employee.name} has been successfully added.`,
    });
    setIsDialogOpen(false);
  };
  
  const handleEditEmployee = async (employee: Employee) => {
    await editEmployee(employee);
    toast({
        title: "Employee Updated",
        description: `${employee.name}'s details have been updated.`,
    });
    setIsDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    await deleteEmployee(employeeId);
     toast({
      title: "Employee Deleted",
      description: `Employee has been removed from the system.`,
      variant: "destructive"
    });
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setSelectedEmployee(null);
    setIsDialogOpen(true);
  }
  
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <>
    <div className="flex justify-end">
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) {
              setSelectedEmployee(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
              </DialogHeader>
              <EmployeeForm 
                setDialogOpen={setIsDialogOpen}
                onSubmit={selectedEmployee ? handleEditEmployee : handleAddEmployee}
                employee={selectedEmployee}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Salary/Rate</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">
                       <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                </TableRow>
            ) : employees.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">
                        No employees found. Add one to get started.
                    </TableCell>
                </TableRow>
            ) : (
                employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>
                  <Badge variant={employee.employmentType === 'Monthly Salary' ? 'secondary' : 'outline'}>
                    {employee.employmentType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {employee.employmentType === 'Monthly Salary'
                    ? formatCurrency(employee.salary)
                    : `${formatCurrency(employee.salary)}/day`}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {user?.role === 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the employee record.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
