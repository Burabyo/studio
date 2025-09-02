"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import type { Company,  RecurringContribution } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CurrencyContextType {
  company: Company | null;
  loading: boolean;
  formatCurrency: (value: number) => string;
  getCurrencySymbol: () => string;
  updateCompany: (data: Partial<Company>) => Promise<void>;
  addContribution: (contribution: Omit<RecurringContribution, 'id'>) => void;
  editContribution: (id: string, contribution: Partial<RecurringContribution>) => void;
  deleteContribution: (id: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { employee } = useAuth(); // 🔥 changed
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee || !employee.companyId) { // 🔥 changed
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const companyRef = doc(db, 'companies', employee.companyId); // 🔥 changed
    const unsubscribe = onSnapshot(companyRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompany(docSnap.data() as Company);
      } else {
        console.error("Company not found!");
        setCompany(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching company data:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [employee]); // 🔥 changed

  const updateCompany = async (data: Partial<Company>) => {
    if (!employee?.companyId) return; // 🔥 changed
    const companyRef = doc(db, 'companies', employee.companyId); // 🔥 changed
    await updateDoc(companyRef, data);
  };
  
 const addContribution = (contribution: Omit<RecurringContribution, 'id'>) => {
  if (!company) return;
  const newContribution: RecurringContribution = { ...contribution, id: uuidv4() };
  const updatedContributions = [...(company.recurringContributions ?? []), newContribution];
  updateCompany({ recurringContributions: updatedContributions });
};

const editContribution = (id: string, contribution: Partial<RecurringContribution>) => {
  if (!company) return;
  const updatedContributions = (company.recurringContributions ?? []).map(c =>
    c.id === id ? { ...c, ...contribution } : c
  );
  updateCompany({ recurringContributions: updatedContributions });
};

const deleteContribution = (id: string) => {
  if (!company) return;
  const updatedContributions = (company.recurringContributions ?? []).filter(c => c.id !== id);
  updateCompany({ recurringContributions: updatedContributions });
};


  const getCurrencySymbol = useCallback(() => {
    if (!company) return '$';
    return company.currency === 'USD' ? '$' : 'FRw';
  }, [company]);
  
  const formatCurrency = useCallback((value: number) => {
     if (!company?.currency) {
       // fallback to USD if company currency is not ready
       return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
     }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: company.currency,
      minimumFractionDigits: company.currency === 'RWF' ? 0 : 2,
      maximumFractionDigits: company.currency === 'RWF' ? 0 : 2,
    }).format(value);
  }, [company]);

  return (
    <CurrencyContext.Provider value={{ 
      company,
      loading,
      formatCurrency, 
      getCurrencySymbol,
      updateCompany,
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
