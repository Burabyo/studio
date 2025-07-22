
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { useAuth } from './auth-context';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface EmployeeContextType {
  employees: Employee[];
  addEmployee: (employeeData: Omit<Employee, 'userId' | 'id'> & { id: string, email: string, password?: string}) => Promise<void>;
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
    if (!user?.companyId || !['admin', 'manager'].includes(user.role)) {
      throw new Error("Only admins or managers can create new employees.");
    }
    if (!employeeData.password) throw new Error("Password is required for new employee account.");
    
    try {
      const token = await user.firebaseUser?.getIdToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const payload = {
          ...employeeData,
          companyId: user.companyId
      };

      const response = await fetch('/api/create-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create employee.");
      }

    } catch (error: any) {
        console.error("Detailed error adding employee: ", error);
        // Check if the error is a JSON parsing error, which indicates the API crashed.
        if (error instanceof SyntaxError) {
             throw new Error("The server returned an invalid response. Please check the API logs.");
        }
        throw new Error(error.message || "An unexpected error occurred.");
    }
  };

  const editEmployee = async (updatedEmployee: Employee) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const { id, ...data } = updatedEmployee;
        const employeeRef = doc(db, `companies/${user.companyId}/employees`, id);
        // Do not allow email/password changes from this form.
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
