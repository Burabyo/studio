
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { app } from '@/lib/firebase'; // We'll create this file

export type UserRole = 'admin' | 'manager' | 'employee';

interface User {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
  employeeId?: string; 
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string, role: UserRole) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a real app, you'd fetch this from a database (like Firestore) after login.
// For this simulation, we'll store it in localStorage.
const getRoleForUser = (uid: string): UserRole => {
    try {
        const storedData = localStorage.getItem(`userRole-${uid}`);
        return storedData ? JSON.parse(storedData).role : 'employee'; // Default to 'employee'
    } catch {
        return 'employee';
    }
};

const getNameForUser = (uid: string): string => {
     try {
        const storedData = localStorage.getItem(`userRole-${uid}`);
        return storedData ? JSON.parse(storedData).name : 'New User';
    } catch {
        return 'New User';
    }
}

const storeUserData = (uid: string, name: string, role: UserRole) => {
    try {
        localStorage.setItem(`userRole-${uid}`, JSON.stringify({ name, role }));
    } catch (e) {
        console.error("Could not access localStorage");
    }
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Simulate fetching user profile from a database
        const role = getRoleForUser(fbUser.uid);
        const name = getNameForUser(fbUser.uid);

        const appUser: User = {
          uid: fbUser.uid,
          email: fbUser.email,
          name: name || fbUser.email || 'User',
          role: role,
          // In a real app, you'd fetch this from your DB
          employeeId: role === 'employee' ? 'EMP001' : undefined,
        };
        setUser(appUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async (email: string, pass: string, name: string, role: UserRole) => {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // Store the name and role after successful creation
      storeUserData(userCredential.user.uid, name, role);
      // Manually set user for immediate UI update
      const appUser: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name,
        role: role,
        employeeId: role === 'employee' ? 'EMP001' : undefined,
      };
      setUser(appUser);
      setFirebaseUser(userCredential.user);
      return userCredential;
  }

  const logout = () => {
    signOut(auth).then(() => {
      router.push('/login');
    });
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, signup, logout }}>
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
