
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { useAuth } from './auth-context';
import { collection, onSnapshot, doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employeeData: Omit<Employee, 'userId'> & {email: string, password?: string}) => Promise<void>;
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


  const addEmployee = async (employeeData: Omit<Employee, 'userId'> & {email: string, password?: string}) => {
    if (!user?.companyId || user.role !== 'admin') throw new Error("Only admins can create new employees.");
    if (!employeeData.password) throw new Error("Password is required for new employee account.");
    
    try {
      // This function now securely handles creating the Auth user and the Firestore docs.
      const createEmployeeAccount = httpsCallable(functions, 'createEmployeeAccount');
      await createEmployeeAccount(employeeData);
    } catch (error: any) {
        console.error("Detailed error adding employee: ", error);
        // The error from the function will be more descriptive.
        throw new Error(error.message || "Failed to create employee account.");
    }
  };

  const editEmployee = async (updatedEmployee: Employee) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const { id, ...data } = updatedEmployee;
        const employeeRef = doc(db, `companies/${user.companyId}/employees`, id);
        // We don't want to update email/password from this generic edit form.
        delete (data as any).email;
        delete (data as any).password;
        await updateDoc(employeeRef, data);
    } catch (error) {
        console.error("Error updating employee: ", error);
        throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        // Future improvement: Call a function to delete the Auth user as well.
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
