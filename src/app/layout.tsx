import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { BranchProvider } from '@/contexts/BranchContext';
import { LocatorInit } from '@/components/LocatorInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Management',
  description: 'Next.js School Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <SignedIn>
            <BranchProvider>
              <div className='flex flex-col h-screen bg-[#F7F8FA]'>
                {/* 상단 헤더 영역 */}
                <Header />
                {/* 사이드바 + 메인 콘텐츠 */}
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
              </div>
            </BranchProvider>
          </SignedIn>
          <SignedOut>
            {children}
          </SignedOut>
          <ToastContainer position='bottom-right' theme='dark' />
          <LocatorInit />
        </body>
      </html>
    </ClerkProvider>
  );
}
