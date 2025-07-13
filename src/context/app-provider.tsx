import { CurrencyProvider } from './currency-context';
import { EmployeeProvider } from './employee-context';
import { TransactionProvider } from './transaction-context';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <EmployeeProvider>
        <TransactionProvider>
          {children}
        </TransactionProvider>
      </EmployeeProvider>
    </CurrencyProvider>
  );
}
