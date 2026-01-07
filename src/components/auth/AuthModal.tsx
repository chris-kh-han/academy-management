'use client';

import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

type AuthModalProps = {
  mode: 'sign-in' | 'sign-up';
  children: React.ReactNode;
};

export function AuthModal({ mode, children }: AuthModalProps) {
  const [open, setOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);

  const isSignIn = currentMode === 'sign-in';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-md overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {isSignIn ? (
              <>
                <LogIn className='w-5 h-5 text-orange-500' />
                <span>로그인</span>
              </>
            ) : (
              <>
                <UserPlus className='w-5 h-5 text-emerald-500' />
                <span>회원가입</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Slide Container */}
        <div className='relative'>
          {/* Sign In Form */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isSignIn
                ? 'translate-x-0 opacity-100'
                : '-translate-x-full absolute inset-0 opacity-0'
            }`}
          >
            <SignInForm onSuccess={() => setOpen(false)} />
            <p className='text-center text-sm text-slate-600 mt-4'>
              계정이 없으신가요?{' '}
              <button
                type='button'
                onClick={() => setCurrentMode('sign-up')}
                className='text-slate-900 font-medium hover:underline cursor-pointer'
              >
                회원가입
              </button>
            </p>
          </div>

          {/* Sign Up Form */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              !isSignIn
                ? 'translate-x-0 opacity-100'
                : 'translate-x-full absolute inset-0 opacity-0'
            }`}
          >
            <SignUpForm onSuccess={() => setOpen(false)} />
            <p className='text-center text-sm text-slate-600 mt-4'>
              이미 계정이 있으신가요?{' '}
              <button
                type='button'
                onClick={() => setCurrentMode('sign-in')}
                className='text-slate-900 font-medium hover:underline cursor-pointer'
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
