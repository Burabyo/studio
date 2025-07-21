
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { useAuth } from './auth-context';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employeeData: Employee) => Promise<void>;
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
    if (!user || !user.companyId) {
        setEmployees([]);
        setLoading(false);
        return;
    };

    setLoading(true);
    const employeesCollectionRef = collection(db, `companies/${user.companyId}/employees`);

    const unsubscribe = onSnapshot(employeesCollectionRef, (snapshot) => {
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


  const addEmployee = async (employeeData: Employee) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const { id, ...data } = employeeData;
        const employeeRef = doc(db, `companies/${user.companyId}/employees`, id);
        await setDoc(employeeRef, data);
    } catch (error: any) {
        console.error("Detailed error adding employee: ", error);
        throw error;
    }
  };

  const editEmployee = async (updatedEmployee: Employee) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const { id, ...data } = updatedEmployee;
        const employeeRef = doc(db, `companies/${user.companyId}/employees`, id);
        await updateDoc(employeeRef, data);
    } catch (error) {
        console.error("Error updating employee: ", error);
        throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const employeeRef = doc(db, `companies/${user.companyId}/employees`, id);
        await deleteDoc(employeeRef);
    } catch (error) {
        console.error("Error deleting employee: ", error);
        throw error;
    }
  };

  return (
    <EmployeeContext.Provider value={{ employees, addEmployee, editEmployee, deleteEmployee, loading }}>
      {children}
    </Employee-context.Provider>
  );
};

export const useEmployeeContext = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployeeContext must be used within an EmployeeProvider');
  }
  return context;
};
