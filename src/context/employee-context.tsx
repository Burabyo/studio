"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Employee } from '@/lib/types';
import { employees as initialEmployees } from '@/app/(app)/employees/data';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  editEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
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
    <EmployeeContext.Provider value={{ employees, addEmployee, editEmployee, deleteEmployee }}>
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
