'use client';

import { useState } from 'react';
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {currentMode === 'sign-in' ? '로그인' : '회원가입'}
          </DialogTitle>
        </DialogHeader>
        {currentMode === 'sign-in' ? (
          <>
            <SignInForm onSuccess={() => setOpen(false)} />
            <p className='text-center text-sm text-slate-600'>
              계정이 없으신가요?{' '}
              <button
                type='button'
                onClick={() => setCurrentMode('sign-up')}
                className='text-slate-900 font-medium hover:underline'
              >
                회원가입
              </button>
            </p>
          </>
        ) : (
          <>
            <SignUpForm onSuccess={() => setOpen(false)} />
            <p className='text-center text-sm text-slate-600'>
              이미 계정이 있으신가요?{' '}
              <button
                type='button'
                onClick={() => setCurrentMode('sign-in')}
                className='text-slate-900 font-medium hover:underline'
              >
                로그인
              </button>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
