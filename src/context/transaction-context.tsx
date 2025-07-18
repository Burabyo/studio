
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
    if (!user || !user.companyId) {
        setTransactions([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const transactionsCollectionRef = collection(db, `companies/${user.companyId}/transactions`);

    const unsubscribe = onSnapshot(transactionsCollectionRef, (snapshot) => {
        const transactionsData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        
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
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        await addDoc(collection(db, `companies/${user.companyId}/transactions`), transaction);
    } catch (error) {
        console.error("Error adding transaction: ", error);
        throw error;
    }
  };

  const editTransaction = async (updatedTransaction: Transaction) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const transactionRef = doc(db, `companies/${user.companyId}/transactions`, updatedTransaction.id);
        const { id, ...data } = updatedTransaction;
        await updateDoc(transactionRef, data);
    } catch (error) {
        console.error("Error updating transaction: ", error);
        throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user?.companyId) throw new Error("User is not associated with a company.");
    try {
        const transactionRef = doc(db, `companies/${user.companyId}/transactions`, id);
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
