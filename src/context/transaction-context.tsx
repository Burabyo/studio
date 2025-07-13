"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Transaction } from '@/lib/types';
import { transactions as initialTransactions } from '@/app/(app)/payroll/data';
import { useEmployeeContext } from './employee-context';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { employees } = useEmployeeContext();
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Sync employee names on initial load
    return initialTransactions.map(t => {
      const employee = employees.find(e => e.id === t.employeeId);
      return { ...t, employeeName: employee?.name || 'Unknown Employee' };
    });
  });

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'employeeName'> & { employeeId: string }) => {
    const employee = employees.find(e => e.id === transaction.employeeId);
    const newTransaction = { 
        ...transaction, 
        id: `TRN${(transactions.length + 1).toString().padStart(3, '0')}`,
        employeeName: employee?.name || 'Unknown Employee',
    };
    setTransactions([...transactions, newTransaction]);
  };

  const editTransaction = (updatedTransaction: Transaction) => {
    const employee = employees.find(e => e.id === updatedTransaction.employeeId);
    const transactionWithCorrectName = {
      ...updatedTransaction,
      employeeName: employee?.name || 'Unknown Employee',
    }
    setTransactions(transactions.map(t => (t.id === updatedTransaction.id ? transactionWithCorrectName : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Effect to update transaction names if employee names change
  React.useEffect(() => {
    setTransactions(currentTransactions => {
      return currentTransactions.map(t => {
        const employee = employees.find(e => e.id === t.employeeId);
        if (employee && t.employeeName !== employee.name) {
          return { ...t, employeeName: employee.name };
        }
        return t;
      });
    });
  }, [employees]);


  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, editTransaction, deleteTransaction }}>
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
