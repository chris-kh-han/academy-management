import type { Metadata } from 'next';
import { Manrope, Do_Hyeon } from 'next/font/google';
import './globals.css';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BranchProvider } from '@/contexts/BranchContext';
import { LocatorInit } from '@/components/LocatorInit';
import SplashScreen from '@/components/SplashScreen';
import MainLayout from '@/components/MainLayout';
import { createClient } from '@/utils/supabase/server';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});
const doHyeon = Do_Hyeon({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-do-hyeon',
});

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

  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${manrope.className} ${manrope.variable} ${doHyeon.variable}`}
        suppressHydrationWarning
      >
        <SplashScreen />
        {user ? (
          <BranchProvider>
            <MainLayout>{children}</MainLayout>
          </BranchProvider>
        ) : (
          children
        )}
        <ToastContainer position='bottom-right' theme='dark' autoClose={1500} />
        <LocatorInit />
      </body>
    </html>
  );
}
