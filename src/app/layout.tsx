import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Menu from '@/components/Menu';
import Navbar from '@/components/Navbar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import Image from 'next/image';
import Link from 'next/link';

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
      <html lang='en'>
        <body className={inter.className}>
          {/* <div className='h-screen flex'>

            <div className='w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4'>
              <Link
                href='/'
                className='flex items-center justify-center lg:justify-start gap-2'
              >
                <Image src='/next.svg' alt='logo' width={128} height={128} />

              </Link>
              <Menu />
            </div>

            <div className='w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-auto flex flex-col'>
              <Navbar />
              {children}
            </div>
          </div> */}
          <SidebarProvider>
            <AppSidebar />
            <main className='w-full'>
              <SidebarTrigger />
              <div className='w-full bg-[#F7F8FA] overflow-auto flex flex-col'>
                <Navbar />
                {children}
              </div>
            </main>
          </SidebarProvider>

          <ToastContainer position='bottom-right' theme='dark' />
        </body>
      </html>
    </ClerkProvider>
  );
}
