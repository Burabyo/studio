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

export type Transaction = {
  id: string;
  employeeId: string;
  type: "advance" | "payment" | "reimbursement" | "deduction";
  status?: "Pending" | "Approved" | "Rejected";
  amount: number;
  notes?: string;
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

export const TransactionProvider = ({ children }: { children: React.ReactNode }) => {
  const { role, employee } = useAuth();
  const [state, setState] = useState<Ctx>({ transactions: [], loading: true });

  useEffect(() => {
    const base = collection(db, "transactions");
    const q =
      role === "employee" && employee?.id
        ? query(base, where("employeeId", "==", employee.id), orderBy("createdAt", "desc"))
        : query(base, orderBy("createdAt", "desc"));

        const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // ✅ Convert Firestore Timestamp to JS Date safely
            createdAt: data.createdAt
              ? (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt))
              : new Date(),
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
      createdAt: serverTimestamp(),
      createdByUid: employee?.id || null,
    });
  };

  const editTransaction = async (id: string, tx: Partial<Transaction>) => {
    const ref = doc(db, "transactions", id);
    await updateDoc(ref, tx);
  };

  const deleteTransaction = async (id: string) => {
    const ref = doc(db, "transactions", id);
    await deleteDoc(ref);
  };

  return { addTransaction, editTransaction, deleteTransaction };
};
