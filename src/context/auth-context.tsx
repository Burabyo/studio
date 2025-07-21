
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
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { app, db } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';
import { createNewCompany } from '@/lib/company';

interface SignupParams {
    email: string;
    password: string;
    name: string;
    isAdmin: boolean;
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
      setLoading(true);
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
             console.warn("User document not found for authenticated user. Signing out.");
             await signOut(auth);
             setUser(null);
          }
        } catch (error: any) {
           console.error("Error fetching user profile from Firestore:", error);
           toast({ variant: "destructive", title: "Auth Error", description: "Could not fetch user profile." });
           await signOut(auth); 
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
  
  const signup = async ({ email, password, name, isAdmin, companyName }: SignupParams) => {
    setLoading(true);
    let userCredential;

    try {
      if (!isAdmin || !companyName) {
        throw new Error("This signup form is for company admins only.");
      }
      
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const { companyId } = await createNewCompany(companyName);
      
      const userProfile: AppUser = {
        uid: fbUser.uid, name, email, role: 'admin', companyId, employeeId: ''
      };
      await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      setUser(userProfile);

      return userCredential;
    } catch (error: any) {
      if (userCredential) {
        await userCredential.user.delete().catch(e => console.error("Failed to clean up user on signup error:", e));
      }
      console.error("ADMIN SIGNUP FAILED:", error.code, error.message);
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
