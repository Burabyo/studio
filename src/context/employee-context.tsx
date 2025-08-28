"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Employee type
export type Employee = {
  name: string;
  jobTitle: string;
  employmentType: string;
  bankName: string;
  accountNumber: string;
  salary: number;
  role: string;
  userId: string | null;
  email: string;
  createdAt?: Timestamp | null;
};

// Add `id`
export type EmployeeWithId = Employee & { id: string };

// State type
type EmployeeState = {
  employees: EmployeeWithId[];
  byId: Record<string, EmployeeWithId>;
  loading: boolean;
  error?: string;
};

// Context value type
type EmployeeContextType = EmployeeState & {
  addEmployee: (employee: Employee) => Promise<void>;
  editEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
};

export const EmployeeContext = createContext<EmployeeContextType | undefined>(
  undefined
);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EmployeeState>({
    employees: [],
    byId: {},
    loading: true,
    error: undefined,
  });

  // 🔥 Fetch employees in real-time
  useEffect(() => {
    const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: EmployeeWithId[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<Employee>;
          return {
            id: docSnap.id,
            name: data.name || "",
            jobTitle: data.jobTitle || "",
            employmentType: data.employmentType || "Monthly Salary",
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            salary: data.salary || 0,
            role: data.role || "employee",
            userId: data.userId || null,
            email: data.email || "",
            createdAt: data.createdAt || null,
          };
        });

        const map = list.reduce((acc, e) => {
          acc[e.id] = e;
          return acc;
        }, {} as Record<string, EmployeeWithId>);

        setState({ employees: list, byId: map, loading: false, error: undefined });
      },
      (err) => setState((s) => ({ ...s, loading: false, error: err.message }))
    );

    return unsub;
  }, []);

  // ➕ Add Employee
  const addEmployee = async (employee: Employee) => {
    await addDoc(collection(db, "employees"), {
      ...employee,
      createdAt: serverTimestamp(),
    });
  };

  // ✏️ Edit Employee
  const editEmployee = async (id: string, data: Partial<Employee>) => {
    const ref = doc(db, "employees", id);
    await updateDoc(ref, data);
  };

  // 🗑️ Delete Employee
  const deleteEmployee = async (id: string) => {
    await deleteDoc(doc(db, "employees", id));
  };

  return (
    <EmployeeContext.Provider
      value={{
        ...state,
        addEmployee,
        editEmployee,
        deleteEmployee,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

// Custom hook
export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error("useEmployees must be used within an EmployeeProvider");
  }
  return context;
};
