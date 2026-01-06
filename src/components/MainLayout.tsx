'use client';

import { useBranch } from '@/contexts/BranchContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentBrand, isInitialized } = useBranch();

  if (!isInitialized) {
    return null; // SplashScreen이 보여지므로 null 반환
  }

  return (
    <div className='flex flex-col h-screen bg-[#FA891A]'>
      <Header />
      {currentBrand ? (
        <SidebarProvider>
          <AppSidebar />
          <main className='w-full overflow-auto'>
            <div className='w-full overflow-auto flex'>
              <div className='hidden md:block pt-6 pl-2'>
                <SidebarTrigger />
              </div>
              <div className='flex-1'>{children}</div>
            </div>
          </main>
        </SidebarProvider>
      ) : (
        <main className='w-full overflow-auto flex-1 flex justify-center'>
          {children}
        </main>
      )}
    </div>
  );
}
