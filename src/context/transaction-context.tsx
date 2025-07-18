
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Transaction } from '@/lib/types';
import { useAuth } from './auth-context';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  editTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "transactions"), (snapshot) => {
        const transactionsData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
            .filter(t => t.id); // Ensure transaction has a valid ID
        
        if (user?.role === 'employee') {
            setTransactions(transactionsData.filter(t => t.employeeId === user.employeeId));
        } else {
            setTransactions(transactionsData);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
        await addDoc(collection(db, "transactions"), transaction);
    } catch (error) {
        console.error("Error adding transaction: ", error);
        throw error;
    }
  };

  const editTransaction = async (updatedTransaction: Transaction) => {
    try {
        const transactionRef = doc(db, "transactions", updatedTransaction.id);
        const { id, ...data } = updatedTransaction;
        await updateDoc(transactionRef, data);
    } catch (error) {
        console.error("Error updating transaction: ", error);
        throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
        const transactionRef = doc(db, "transactions", id);
        await deleteDoc(transactionRef);
    } catch (error) {
        console.error("Error deleting transaction: ", error);
        throw error;
    }
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, editTransaction, deleteTransaction, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
};
