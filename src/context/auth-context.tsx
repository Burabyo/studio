
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
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, query, where, getDocs, collection, writeBatch, limit, collectionGroup } from "firebase/firestore"; 
import { app, db } from '@/lib/firebase';
import type { Employee, User as AppUser } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'manager' | 'employee';


interface SignupParams {
    email: string;
    password: string;
    name: string;
    employeeId?: string; 
    companyName?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (params: SignupParams) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(app);
  const functions = getFunctions(app, 'us-central1');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Use the callable function to fetch the user's profile securely
          const getUserProfile = httpsCallable(functions, 'getUserProfile');
          const result = await getUserProfile();
          const userData = result.data as any;

          if (!userData) {
             throw new Error("User profile data is missing.");
          }

          const appUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: userData.name || fbUser.email || 'User',
            role: userData.role || 'employee',
            employeeId: userData.employeeId,
            companyId: userData.companyId || null,
          };
          setUser(appUser);
        } catch (error: any) {
           console.error("Error fetching user profile via function:", error.code, error.message, error.details);
           setUser(null);
           await signOut(auth); // Sign out if profile fetch fails
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, functions]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
 const signup = async ({ email, password, name, companyName, employeeId }: SignupParams) => {
    setLoading(true);
    try {
      const isJoining = !!employeeId;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const batch = writeBatch(db);

      let companyId: string;
      let finalRole: UserRole = 'employee';
      
      if (isJoining) { // Joining an existing company
        if (!employeeId) throw new Error("Employee ID is required to join a company.");
        
        const employeeQuery = query(
            collectionGroup(db, 'employees'), 
            where('id', '==', employeeId), 
            limit(1)
        );

        const employeeQuerySnapshot = await getDocs(employeeQuery);

        if (employeeQuerySnapshot.empty) {
            await fbUser.delete();
            throw new Error(`Employee with ID "${employeeId}" not found.`);
        }
        
        const employeeDoc = employeeQuerySnapshot.docs[0];
        const foundEmployeeRecord = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
        
        const usersQuery = query(collection(db, "users"), where("employeeId", "==", employeeId), limit(1));
        const userSnapshot = await getDocs(usersQuery);
        if (!userSnapshot.empty) {
            await fbUser.delete();
            throw new Error(`Employee ID "${employeeId}" is already linked to another account.`);
        }
        
        finalRole = foundEmployeeRecord.role; 
        companyId = employeeDoc.ref.parent.parent!.id;

      } else { // Admin flow: Creating a new company
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

      const userProfileData: any = {
        uid: fbUser.uid,
        name,
        email,
        role: finalRole,
        companyId: companyId,
      };

      if (isJoining) {
        userProfileData.employeeId = employeeId;
      }
      
      const userDocRef = doc(db, "users", fbUser.uid);
      batch.set(userDocRef, userProfileData);

      await batch.commit();

      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        role: finalRole,
        companyId: companyId,
        employeeId: userProfileData.employeeId,
      };
      setUser(appUser);
      setFirebaseUser(fbUser);
      return userCredential;
    } catch (error: any) {
        console.error("SIGNUP FAILED:", error);
        toast({
            title: "Sign-up Failed",
            description: error.message || "An unknown error occurred.",
            variant: "destructive"
        });
        setLoading(false);
        throw error;
    }
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
