
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
    role?: UserRole; // Role is now optional as it will be determined
    companyName?: string; 
    employeeId?: string; 
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
  const functions = getFunctions(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Use the Firebase Function to get the user profile
          const getUserProfile = httpsCallable(functions, 'getUserProfile');
          const result = await getUserProfile();
          const userData = result.data as any;

          const appUser: User = {
            uid: fbUser.uid,
            email: fbUser.email,
            name: userData.name || fbUser.email || 'User',
            role: userData.role || 'employee',
            employeeId: userData.employeeId,
            companyId: userData.companyId || null,
          };
          setUser(appUser);
        } catch (error) {
           console.error("Error fetching user profile via function:", error);
           setUser(null);
           // Log out the user if their profile is missing or inaccessible
           await signOut(auth);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async ({ email, password, name, companyName, employeeId }: SignupParams) => {
      setLoading(true);

      // Determine role based on which fields are provided
      const role: UserRole = employeeId ? 'employee' : 'admin'; // Simplified logic

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const batch = writeBatch(db);

      let companyId: string;
      let finalRole: UserRole = role;
      
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
      else { // 'employee' or 'manager' joining flow
        if (!employeeId) throw new Error("Employee ID is required to join a company.");
        
        const employeeQuery = query(
            collectionGroup(db, 'employees'), 
            where('id', '==', employeeId), 
            limit(1)
        );

        const employeeQuerySnapshot = await getDocs(employeeQuery);

        if (employeeQuerySnapshot.empty) {
            await fbUser.delete();
            throw new Error(`Employee with ID "${employeeId}" not found in any company.`);
        }
        
        const employeeDoc = employeeQuerySnapshot.docs[0];
        const foundEmployeeRecord = { id: employeeDoc.id, ...employeeDoc.data() } as Employee;
        
        finalRole = foundEmployeeRecord.role; // Use the role from the database record
        companyId = employeeDoc.ref.parent.parent!.id; 

        const usersQuery = query(collection(db, "users"), where("employeeId", "==", employeeId), where("companyId", "==", companyId), limit(1));
        const userSnapshot = await getDocs(usersQuery);
        if (!userSnapshot.empty) {
            await fbUser.delete();
            throw new Error(`Employee ID "${employeeId}" is already linked to another account.`);
        }
      }

      const userProfileData: any = {
        uid: fbUser.uid,
        name,
        email,
        role: finalRole,
        companyId: companyId,
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
        companyId: companyId,
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
