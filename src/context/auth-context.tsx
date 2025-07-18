
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
import { doc, getDoc, setDoc, query, where, getDocs, collection, writeBatch, limit, collectionGroup } from "firebase/firestore"; 
import { app, db } from '@/lib/firebase';
import type { Employee } from '@/lib/types';

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
    role: 'admin' | 'employee'; // Role from the form determines which flow to use
    companyName?: string; // For new admins creating a company
    employeeId?: string; // For employees/managers linking to a record
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
      let finalRole: UserRole = 'employee';
      
      if (role === 'admin') {
        if (!companyName) throw new Error("Company name is required for admin sign-up.");
        finalRole = 'admin';
        
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
      else { // 'employee' or 'manager' signup flow
        if (!employeeId) throw new Error("Employee ID is required for employee sign-up.");
        
        // Use a collection group query to find the employee across all companies.
        const employeeQuery = query(
            collectionGroup(db, 'employees'), 
            where('id', '==', employeeId), 
            limit(1)
        );

        const employeeQuerySnapshot = await getDocs(employeeQuery);

        if (employeeQuerySnapshot.empty) {
            await fbUser.delete(); // Clean up the created auth user
            throw new Error(`Employee with ID "${employeeId}" not found in any company.`);
        }
        
        const employeeDoc = employeeQuerySnapshot.docs[0];
        const foundEmployeeRecord = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
        const foundCompanyId = employeeDoc.ref.parent.parent!.id; // companies/{companyId}/employees/{employeeId}

        // Check if this employee ID is already linked to a user account
        const usersQuery = query(collection(db, "users"), where("employeeId", "==", employeeId), where("companyId", "==", foundCompanyId), limit(1));
        const userSnapshot = await getDocs(usersQuery);
        if (!userSnapshot.empty) {
            await fbUser.delete();
            throw new Error(`Employee ID "${employeeId}" is already linked to another account.`);
        }
        
        companyId = foundCompanyId;
        finalRole = foundEmployeeRecord.role;
      }

      const userProfileData: any = {
        uid: fbUser.uid,
        name,
        email,
        role: finalRole,
        companyId: companyId!,
      };

      if (finalRole !== 'admin' && employeeId) {
        userProfileData.employeeId = employeeId;
      }
      
      const userDocRef = doc(db, "users", fbUser.uid);
      batch.set(userDocRef, userProfileData);

      await batch.commit();

      const appUser: User = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        role: finalRole,
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

    