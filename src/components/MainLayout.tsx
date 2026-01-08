'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function SidebarToggleButton() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className='
        hidden md:flex
        fixed top-1/2 -translate-y-1/2 z-50
        w-6 h-14
        bg-white/90 backdrop-blur-sm
        border border-slate-200
        rounded-r-lg
        shadow-[2px_0_12px_rgba(0,0,0,0.15)]
        items-center justify-center
        hover:bg-orange-50 hover:border-orange-300
        transition-all duration-200
        cursor-pointer
      '
      style={{ left: open ? 'calc(16rem - 1px)' : '0' }}
      aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}
    >
      {open ? (
        <ChevronLeft className='w-4 h-4 text-slate-600' />
      ) : (
        <ChevronRight className='w-4 h-4 text-slate-600' />
      )}
    </button>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarToggleButton />
      <main className='flex-1 overflow-auto flex flex-col'>{children}</main>
    </>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentBrand, isInitialized } = useBranch();
  const pathname = usePathname();
  const router = useRouter();

  // 브랜드 없으면 온보딩으로 리다이렉트 (온보딩 페이지 제외)
  useEffect(() => {
    if (isInitialized && !currentBrand && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [isInitialized, currentBrand, pathname, router]);

  if (!isInitialized) {
    return null;
  }

  // 브랜드 없고 온보딩이 아니면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!currentBrand && pathname !== '/onboarding') {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-screen ${currentBrand ? 'bg-slate-100' : 'bg-[#FA891A]'}`}
    >
      <Header />
      {currentBrand ? (
        <SidebarProvider>
          <MainContent>{children}</MainContent>
        </SidebarProvider>
      ) : (
        <main className='w-full overflow-auto flex-1 flex justify-center'>
          {children}
        </main>
      )}
    </div>
  );
}
