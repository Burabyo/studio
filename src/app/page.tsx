
'use client';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);
  
  return null; // or a loading spinner
}
