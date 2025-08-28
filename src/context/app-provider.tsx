"use client";

import React from "react";
import { AuthProvider } from "./auth-context";
import { CurrencyProvider } from "./currency-context";
import { EmployeeProvider } from "./employee-context";
import { TransactionProvider } from "./transaction-context";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <EmployeeProvider>
          <TransactionProvider>{children}</TransactionProvider>
        </EmployeeProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
