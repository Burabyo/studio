
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Employee } from '@/lib/types';
import { employees as initialEmployees } from '@/app/(app)/employees/data';
import { useAuth } from './auth-context';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  editEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  
  const visibleEmployees = React.useMemo(() => {
    if (user?.role === 'employee') {
      // In a real app with real auth, we'd use user.uid to find the employee record
      return employees.filter(e => e.id === user.employeeId);
    }
    return employees;
  }, [user, employees]);


  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    // This is a simplified way to generate an ID. In a real app, a database would handle this.
    const newEmployee = { ...employee, id: `EMP${(employees.length + 1).toString().padStart(3, '0')}` };
    setEmployees([...employees, newEmployee]);
  };

  const editEmployee = (updatedEmployee: Employee) => {
    setEmployees(employees.map(e => (e.id === updatedEmployee.id ? updatedEmployee : e)));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  return (
    <EmployeeContext.Provider value={{ employees: visibleEmployees, addEmployee, editEmployee, deleteEmployee }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployeeContext must be used within an EmployeeProvider');
  }
  return context;
};
