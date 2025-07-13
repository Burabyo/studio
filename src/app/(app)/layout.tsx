
'use client';

import * as React from 'react';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { MainSidebar } from "@/components/main-sidebar"
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex min-h-screen">
          <div className="hidden md:flex flex-col gap-4 p-4 border-r border-sidebar-border bg-sidebar">
            <Skeleton className='h-8 w-40' />
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
              <Skeleton className='h-8 w-full' />
            </div>
          </div>
          <main className="flex-1 p-4 sm:p-6 space-y-4">
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-24 w-full' />
            <Skeleton className='h-64 w-full' />
          </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <MainSidebar />
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <AppLayoutContent>{children}</AppLayoutContent>
  );
}
