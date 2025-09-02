"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Company } from "@/lib/types";

export function useCompany(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchCompany = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "companies", companyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCompany(docSnap.data() as Company);
        } else {
          setCompany(null);
        }
      } catch (err) {
        console.error("Error fetching company:", err);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  return { company, loading };
}
