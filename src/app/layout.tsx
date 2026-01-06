import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { BranchProvider } from '@/contexts/BranchContext';
import { LocatorInit } from '@/components/LocatorInit';
import { createClient } from '@/utils/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Management',
  description: 'F&B Management System',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 유저가 속한 지점이 있는지 확인 (onboarding 상태 체크)
  let hasBranch: boolean | null = false;
  if (user) {
    const { data: branches } = await supabase
      .from('branch_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    hasBranch = branches && branches.length > 0;
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {user ? (
          <BranchProvider>
            <div className='flex flex-col h-screen bg-[#F7F8FA]'>
              {/* 상단 헤더 영역 - onboarding 시에도 표시 */}
              <Header />
              {/* 사이드바 + 메인 콘텐츠 */}
              {hasBranch ? (
                <SidebarProvider>
                  <AppSidebar />
                  <main className='w-full overflow-auto'>
                    <div className='w-full overflow-auto flex'>
                      {/* SidebarTrigger - md 이상에서만 표시 */}
                      <div className='hidden md:block pt-6 pl-2'>
                        <SidebarTrigger />
                      </div>
                      <div className='flex-1'>{children}</div>
                    </div>
                  </main>
                </SidebarProvider>
              ) : (
                <main className='w-full overflow-auto flex-1 flex items-center justify-center'>
                  {children}
                </main>
              )}
            </div>
          </BranchProvider>
        ) : (
          children
        )}
        <ToastContainer position='bottom-right' theme='dark' />
        <LocatorInit />
      </body>
    </html>
  );
}
