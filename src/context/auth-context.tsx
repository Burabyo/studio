
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
import type { Employee, User as AppUser } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { createNewCompany } from '@/lib/company';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
             // This can happen briefly during signup, so we don't error out immediately.
             // If it persists, it means the user doc was never created.
             console.log("User profile not found, likely during signup transition.");
             // We will let the signup function handle setting the user state.
             // For a normal login, if the doc is missing, we sign out.
             if (user === null) { // only sign out if we are not in a signup flow
                setUser(null);
                await signOut(auth);
             }
             setLoading(false);
             return;
          }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async ({ email, password, name, companyName, employeeId }: SignupParams) => {
    setLoading(true);
    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        if (employeeId) { // Joining an existing company
            const employeeQuery = query(collectionGroup(db, 'employees'), where('id', '==', employeeId), limit(1));
            const employeeSnapshot = await getDocs(employeeQuery);

            if (employeeSnapshot.empty) {
                throw new Error(`Employee with ID "${employeeId}" not found.`);
            }

            const employeeDoc = employeeSnapshot.docs[0];
            const employeeData = employeeDoc.data() as Employee;
            const companyId = employeeDoc.ref.parent.parent!.id;

            const userProfile: AppUser = {
                uid: fbUser.uid, name, email, role: employeeData.role, companyId, employeeId
            };
            await setDoc(doc(db, 'users', fbUser.uid), userProfile);
            setUser(userProfile);

        } else if (companyName) { // Admin creating a new company
            const { companyId } = await createNewCompany(companyName);
            const userProfile: AppUser = {
                uid: fbUser.uid, name, email, role: 'admin', companyId, employeeId: ''
            };
            await setDoc(doc(db, 'users', fbUser.uid), userProfile);
            setUser(userProfile);
        } else {
            throw new Error("Signup requires either an Employee ID or a Company Name.");
        }
        
        return userCredential;

    } catch (error: any) {
        // If signup fails at any point, delete the created Firebase auth user to allow them to try again.
        if (userCredential) {
            await userCredential.user.delete();
        }
        console.error("SIGNUP FAILED:", error);
        toast({
            title: "Sign-up Failed",
            description: error.message || "An unknown error occurred.",
            variant: "destructive"
        });
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
