
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'admin' | 'manager' | 'employee';

interface User {
  id: string;
  name: string;
  role: UserRole;
  employeeId?: string; // Link to employee data for 'employee' role
}

const SIMULATED_USERS: Record<UserRole, User> = {
  admin: { id: 'user-admin', name: 'Admin User', role: 'admin' },
  manager: { id: 'user-manager', name: 'Manager User', role: 'manager' },
  employee: { id: 'user-employee-001', name: 'Alice Johnson', role: 'employee', employeeId: 'EMP001' },
};

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Simulate checking for a logged-in user in session storage
    try {
        const storedUserRole = sessionStorage.getItem('userRole');
        if (storedUserRole && SIMULATED_USERS[storedUserRole as UserRole]) {
            setUser(SIMULATED_USERS[storedUserRole as UserRole]);
        }
    } catch(e) {
        console.error("Could not access session storage");
    } finally {
        setLoading(false);
    }
  }, []);

  const login = (role: UserRole) => {
    const userToLogin = SIMULATED_USERS[role];
    if (userToLogin) {
      setUser(userToLogin);
      try {
        sessionStorage.setItem('userRole', role);
      } catch(e) {
          console.error("Could not access session storage");
      }
    }
  };

  const logout = () => {
    setUser(null);
    try {
        sessionStorage.removeItem('userRole');
    } catch(e) {
        console.error("Could not access session storage");
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
