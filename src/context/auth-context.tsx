
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
import { doc, getDoc, setDoc, query, where, getDocs, collection, writeBatch, limit, collectionGroup, updateDoc, runTransaction } from "firebase/firestore"; 
import { app, db } from '@/lib/firebase';
import type { Employee, User as AppUser } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { createNewCompany } from '@/lib/company';

interface SignupParams {
    email: string;
    password: string;
    name: string;
    isAdmin: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
             const userData = userDoc.data();
             const appUser: AppUser = {
                uid: fbUser.uid,
                email: fbUser.email,
                name: userData.name || fbUser.email || 'User',
                role: userData.role || 'employee',
                employeeId: userData.employeeId,
                companyId: userData.companyId || null,
             };
             setUser(appUser);
          } else {
             // This can happen briefly during signup before the doc is created.
             // If it persists, it means the user was authenticated but their profile was never saved.
             console.warn("User document not found for authenticated user. Signing out.");
             await signOut(auth);
             setUser(null);
          }
        } catch (error: any) {
           console.error("Error fetching user profile from Firestore:", error);
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
  }, [auth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async ({ email, password, name, isAdmin, companyName, employeeId }: SignupParams) => {
    setLoading(true);
    let userCredential;

    try {
      if (isAdmin) {
        // --- Admin Signup Flow ---
        if (!companyName) throw new Error("Company name is required for admin signup.");
        
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        const { companyId } = await createNewCompany(companyName);
        
        const userProfile: AppUser = {
          uid: fbUser.uid, name, email, role: 'admin', companyId, employeeId: ''
        };
        await setDoc(doc(db, 'users', fbUser.uid), userProfile);
        setUser(userProfile); // Manually set user state to complete login

      } else {
        // --- Employee/Manager Signup Flow ---
        if (!employeeId) throw new Error("Employee ID is required to join a company.");
        
        const employeeQuery = query(collectionGroup(db, 'employees'), where('id', '==', employeeId), limit(1));
        const employeeSnapshot = await getDocs(employeeQuery);

        if (employeeSnapshot.empty) {
          throw new Error(`Employee with ID "${employeeId}" not found.`);
        }

        const employeeDoc = employeeSnapshot.docs[0];
        const employeeData = employeeDoc.data() as Employee;
        
        if (employeeData.userId) {
            throw new Error(`This employee account has already been claimed. Please contact your administrator.`);
        }
        
        if (employeeData.name.toLowerCase() !== name.toLowerCase()) {
            throw new Error(`The name you entered does not match the name on file for this Employee ID.`);
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        const companyId = employeeDoc.ref.parent.parent!.id;

        // Create the user profile and update the employee record in one transaction
        await runTransaction(db, async (transaction) => {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const empDocRef = doc(db, 'companies', companyId, 'employees', employeeId);

            const userProfile: AppUser = {
                uid: fbUser.uid, name, email, role: employeeData.role, companyId, employeeId
            };

            transaction.set(userDocRef, userProfile);
            transaction.update(empDocRef, { userId: fbUser.uid });
            
            setUser(userProfile); // Manually set user state to complete login
        });
      }
      return userCredential;
    } catch (error: any) {
      if (userCredential) {
        await userCredential.user.delete().catch(e => console.error("Failed to clean up user on signup error:", e));
      }
      console.error("SIGNUP FAILED:", error);
      setLoading(false);
      throw error;
    }
  };

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
