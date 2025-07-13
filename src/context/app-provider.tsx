import { EmployeeProvider } from './employee-context';
import { TransactionProvider } from './transaction-context';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <EmployeeProvider>
      <TransactionProvider>
        {children}
      </TransactionProvider>
    </EmployeeProvider>
  );
}
