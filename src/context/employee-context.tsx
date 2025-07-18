
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { useAuth } from './auth-context';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  editEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  loading: boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
        setEmployees([]);
        setLoading(false);
        return;
    };

    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "employees"), (snapshot) => {
        const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        
        if (user?.role === 'employee') {
            setEmployees(employeesData.filter(e => e.id === user.employeeId));
        } else {
            setEmployees(employeesData);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching employees: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
        // Use setDoc with a specific ID to prevent duplicates
        const employeeRef = doc(db, "employees", employeeData.id);
        await setDoc(employeeRef, employeeData);
    } catch (error) {
        console.error("Error adding employee: ", error);
    }
  };

  const editEmployee = async (updatedEmployee: Employee) => {
    try {
        const employeeRef = doc(db, "employees", updatedEmployee.id);
        await updateDoc(employeeRef, updatedEmployee);
    } catch (error) {
        console.error("Error updating employee: ", error);
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
        const employeeRef = doc(db, "employees", id);
        await deleteDoc(employeeRef);
    } catch (error) {
        console.error("Error deleting employee: ", error);
    }
  };

  return (
    <EmployeeContext.Provider value={{ employees, addEmployee, editEmployee, deleteEmployee, loading }}>
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
