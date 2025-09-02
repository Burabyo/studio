"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, limit, onSnapshot, query, setDoc, where, getDocs } from "firebase/firestore";
import type { Employee } from "@/lib/types";

type Role = "admin" | "manager" | "employee" | undefined;

type Ctx = {
  user: User | null;
  loading: boolean;
  role: Role;
  employee: (Employee & { id: string }) | null;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: { email: string; password: string; name: string; companyName: string; isAdmin?: boolean }) => Promise<User>;
};

const AuthContext = createContext<Ctx>({
  user: null,
  loading: true,
  role: undefined,
  employee: null,
  logout: async () => {},
  login: async () => { throw new Error("login not implemented"); },
  signup: async () => { throw new Error("signup not implemented"); },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<(Employee & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);

      if (u?.uid) {
        const q = query(collection(db, "employees"), where("authUid", "==", u.uid), limit(1));
        const unsubEmp = onSnapshot(q, (snap) => {
          const doc = snap.docs[0];
          setEmployee(doc ? ({ id: doc.id, ...(doc.data() as any) }) : null);
        });
        return () => unsubEmp();
      } else {
        setEmployee(null);
      }
    });
    return unsub;
  }, []);

  const role = employee?.role as Role;

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signup = async ({ email, password, name, companyName, isAdmin }: { 
    email: string; password: string; name: string; companyName: string; isAdmin?: boolean 
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    let companyId: string;

    if (isAdmin) {
      // Create a new company document
      const companyRef = doc(collection(db, "companies"));
      await setDoc(companyRef, {
        name: companyName,
        createdAt: new Date(),
        ownerUid: cred.user.uid,
      });
      companyId = companyRef.id;
    } else {
      // Look up existing company by name
      const q = query(
        collection(db, "companies"),
        where("name", "==", companyName),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error("Company not found");
      }
      companyId = snap.docs[0].id;
    }

    // Save employee document with companyId
    const employeeDoc = doc(db, "employees", cred.user.uid);
    await setDoc(employeeDoc, {
      name,
      email,
      role: isAdmin ? "admin" : "employee",
      companyName,
      companyId, // ✅ added
      authUid: cred.user.uid,
      createdAt: new Date(),
    });

    return cred.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setEmployee(null);
  };

  const value = useMemo(() => ({ user, loading, role, employee, logout, login, signup }), [user, loading, role, employee]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
