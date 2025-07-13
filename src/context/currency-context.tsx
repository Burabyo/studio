"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type Currency = 'USD' | 'RWF';

export interface RecurringContribution {
  name: string;
  percentage: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
  getCurrencySymbol: () => string;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  recurringContributions: RecurringContribution[];
  addContribution: (contribution: RecurringContribution) => void;
  editContribution: (index: number, contribution: RecurringContribution) => void;
  deleteContribution: (index: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [taxRate, setTaxRate] = useState(20); // Default 20%
  const [recurringContributions, setRecurringContributions] = useState<RecurringContribution[]>([
    { name: 'Pension Fund', percentage: 5 } // Default 5%
  ]);

  const addContribution = (contribution: RecurringContribution) => {
    setRecurringContributions([...recurringContributions, contribution]);
  };

  const editContribution = (index: number, contribution: RecurringContribution) => {
    const newContributions = [...recurringContributions];
    newContributions[index] = contribution;
    setRecurringContributions(newContributions);
  };

  const deleteContribution = (index: number) => {
    setRecurringContributions(recurringContributions.filter((_, i) => i !== index));
  };


  const getCurrencySymbol = useCallback(() => {
    return currency === 'USD' ? '$' : 'FRw';
  }, [currency]);
  
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'RWF' ? 0 : 2,
      maximumFractionDigits: currency === 'RWF' ? 0 : 2,
    }).format(value);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatCurrency, 
      getCurrencySymbol,
      taxRate,
      setTaxRate,
      recurringContributions,
      addContribution,
      editContribution,
      deleteContribution
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
