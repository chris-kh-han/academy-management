'use client';

import { useState } from 'react';
import { login } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess?.();
    }
  }

  return (
    <form action={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='email'>이메일</Label>
        <Input
          id='email'
          name='email'
          type='email'
          placeholder='email@example.com'
          required
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='password'>비밀번호</Label>
        <Input
          id='password'
          name='password'
          type='password'
          placeholder='••••••••'
          required
        />
      </div>
      {error && <p className='text-sm text-red-500'>{error}</p>}
      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
