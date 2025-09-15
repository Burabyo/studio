"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./auth-context";

// ✅ Updated Transaction type to match your table
export type Transaction = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // ISO string for the transaction
  type: "Advance" | "Loan" | "Bonus" | "Deduction";
  amount: number;
  description?: string;
  status: "Pending" | "Approved" | "Denied";
  createdAt?: Date;
  createdByUid?: string | null;
};

type Ctx = {
  transactions: Transaction[];
  loading: boolean;
  error?: string;
};

const TransactionContext = createContext<Ctx>({
  transactions: [],
  loading: true,
});

// ✅ Helper function to normalize type
// ✅ Safe normalization
const normalizeType = (t?: string): Transaction["type"] => {
  const typeStr = t || "Advance"; // fallback if undefined
  switch (typeStr.toLowerCase()) {
    case "advance":
      return "Advance";
    case "loan":
      return "Loan";
    case "bonus":
      return "Bonus";
    case "deduction":
      return "Deduction";
    default:
      return "Advance"; // fallback
  }
};


export const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const { role, employee } = useAuth();
  const [state, setState] = useState<Ctx>({ transactions: [], loading: true });

  useEffect(() => {
    const base = collection(db, "transactions");
    const q =
      role === "employee" && employee?.id
        ? query(base, where("employeeId", "==", employee.id), orderBy("date", "desc"))
        : query(base, orderBy("date", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            employeeId: data.employeeId,
            employeeName: data.employeeName || "Unknown",
            date: data.date
              ? data.date instanceof Timestamp
                ? data.date.toDate().toISOString()
                : data.date
              : new Date().toISOString(),
            type: normalizeType(data.type),
            amount: Number(data.amount || 0),
            description: data.description || "",
            status: data.status as Transaction["status"] || "Pending",
            createdAt: data.createdAt
              ? data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt)
              : new Date(),
            createdByUid: data.createdByUid || null,
          } as Transaction;
        });
        setState({ transactions: list, loading: false });
      },
      (err) => setState((s) => ({ ...s, loading: false, error: err.message }))
    );

    return unsub;
  }, [role, employee?.id]);

  const value = useMemo(() => state, [state]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};

export const useTransactions = () => useContext(TransactionContext);

// Firestore actions for add/edit/delete
export const useTransactionActions = () => {
  const { employee } = useAuth();

  const addTransaction = async (tx: Omit<Transaction, "id" | "createdAt">) => {
    const ref = collection(db, "transactions");
    await addDoc(ref, {
      ...tx,
      type: normalizeType(tx.type), // ✅ Normalize before sending to Firestore
      createdAt: serverTimestamp(),
      createdByUid: employee?.id || null,
      date: tx.date || new Date().toISOString(),
      status: tx.status || "Pending",
    });
  };

  const editTransaction = async (id: string, tx: Partial<Transaction>) => {
    const ref = doc(db, "transactions", id);
    if (tx.type) tx.type = normalizeType(tx.type);
    await updateDoc(ref, tx);
  };

  const deleteTransaction = async (id: string) => {
    const ref = doc(db, "transactions", id);
    await deleteDoc(ref);
  };

  return { addTransaction, editTransaction, deleteTransaction };
};
