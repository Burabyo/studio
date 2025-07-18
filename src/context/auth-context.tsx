
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
import { doc, getDoc, setDoc, updateDoc, query, where, getDocs, collection } from "firebase/firestore"; 
import { app, db } from '@/lib/firebase';

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
  signup: (email: string, pass: string, name: string, role: UserRole, employeeId?: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const appUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: userData.name || fbUser.email || 'User',
            role: userData.role || 'employee',
            employeeId: userData.employeeId,
          };
          setUser(appUser);
        } else {
             const appUser: User = {
                uid: fbUser.uid,
                email: fbUser.email,
                name: fbUser.email || 'User',
                role: 'employee',
            };
            setUser(appUser);
        }

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
  
  const signup = async (email: string, pass: string, name: string, role: UserRole, employeeId?: string) => {
      setLoading(true);

      if (role === 'employee') {
        if (!employeeId) {
            throw new Error("Employee ID is required for employee role.");
        }
        
        // 1. Check if an employee with this ID exists
        const employeeRef = doc(db, "employees", employeeId);
        const employeeDoc = await getDoc(employeeRef);
        if (!employeeDoc.exists()) {
            throw new Error(`Employee with ID "${employeeId}" not found.`);
        }
        
        // 2. Check if this employee ID is already linked to a user account
        const usersQuery = query(collection(db, "users"), where("employeeId", "==", employeeId));
        const querySnapshot = await getDocs(usersQuery);
        if (!querySnapshot.empty) {
            throw new Error(`Employee ID "${employeeId}" is already linked to another account.`);
        }
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      
      const userProfileData: any = {
        uid: fbUser.uid,
        name,
        email,
        role,
      };

      if (role === 'employee' && employeeId) {
        userProfileData.employeeId = employeeId;
      }
      
      await setDoc(doc(db, "users", fbUser.uid), userProfileData);

      const appUser: User = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        role: role,
        employeeId: userProfileData.employeeId,
      };
      setUser(appUser);
      setFirebaseUser(fbUser);
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
