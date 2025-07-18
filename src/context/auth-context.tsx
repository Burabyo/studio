
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
import { doc, getDoc, setDoc, updateDoc, query, where, getDocs, collection, writeBatch } from "firebase/firestore"; 
import { app, db } from '@/lib/firebase';

export type UserRole = 'admin' | 'manager' | 'employee';

interface User {
  uid: string;
  email: string | null;
  name: string;
  role: UserRole;
  employeeId?: string; 
  companyId: string | null;
}

interface SignupParams {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    companyName?: string; // For new admins creating a company
    employeeId?: string; // For employees linking to a record
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (params: SignupParams) => Promise<any>;
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
            companyId: userData.companyId || null,
          };
          setUser(appUser);
        } else {
            console.warn("User document not found for authenticated user:", fbUser.uid);
            // This case should ideally not happen after signup is complete.
            // You might want to log out the user or create a default user doc.
            setUser(null);
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
  
  const signup = async ({ email, password, name, role, companyName, employeeId }: SignupParams) => {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const batch = writeBatch(db);

      let companyId: string;
      
      // Admin role: Create a new company
      if (role === 'admin') {
        if (!companyName) throw new Error("Company name is required for admin sign-up.");
        
        const newCompanyRef = doc(collection(db, "companies"));
        companyId = newCompanyRef.id;

        const companyData = {
          id: companyId,
          name: companyName,
          currency: 'USD',
          taxRate: 20,
          recurringContributions: [
            { id: 'pension', name: 'Pension Fund', percentage: 5 }
          ],
          payslipInfo: {
            companyName: companyName,
            companyTagline: `Payroll for ${companyName}`,
            companyContact: `contact@${companyName.toLowerCase().replace(/\s+/g, '')}.com`
          }
        };
        batch.set(newCompanyRef, companyData);
      }
      // Employee role: Find the company they belong to
      else if (role === 'employee') {
        if (!employeeId) throw new Error("Employee ID is required for employee sign-up.");
        
        const companiesQuery = query(collection(db, "companies"), where('id', '!=', ''));
        const companiesSnapshot = await getDocs(companiesQuery);
        let found = false;
        
        for (const companyDoc of companiesSnapshot.docs) {
            const employeeRef = doc(db, `companies/${companyDoc.id}/employees`, employeeId);
            const employeeDoc = await getDoc(employeeRef);

            if (employeeDoc.exists()) {
                const usersQuery = query(collection(db, "users"), where("employeeId", "==", employeeId), where("companyId", "==", companyDoc.id));
                const userSnapshot = await getDocs(usersQuery);
                if (!userSnapshot.empty) {
                    throw new Error(`Employee ID "${employeeId}" is already linked to another account.`);
                }
                companyId = companyDoc.id;
                found = true;
                break;
            }
        }
        if (!found) {
            await fbUser.delete(); // Clean up created user if validation fails
            throw new Error(`Employee with ID "${employeeId}" not found in any company.`);
        }
      } else {
         await fbUser.delete();
         throw new Error("Invalid role for signup.");
      }

      const userProfileData: any = {
        uid: fbUser.uid,
        name,
        email,
        role,
        companyId: companyId!,
      };

      if (role === 'employee' && employeeId) {
        userProfileData.employeeId = employeeId;
      }
      
      const userDocRef = doc(db, "users", fbUser.uid);
      batch.set(userDocRef, userProfileData);

      await batch.commit();

      const appUser: User = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        role: role,
        companyId: companyId!,
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
