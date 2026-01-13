'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ImageUpload';
import { useBranch } from '@/contexts/BranchContext';

export default function BusinessSettingsForm() {
  const { currentBrand, currentBranch, refreshContext } = useBranch();
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessHoursStart, setBusinessHoursStart] = useState('09:00');
  const [businessHoursEnd, setBusinessHoursEnd] = useState('22:00');

  // Context에서 초기값 로드
  useEffect(() => {
    if (currentBrand) {
      setLogoUrl(currentBrand.logo_url || '');
    }
    if (currentBranch) {
      setAddress(currentBranch.address || '');
      setPhone(currentBranch.phone || '');
      setEmail(currentBranch.email || '');
      setBusinessHoursStart(currentBranch.business_hours_start || '09:00');
      setBusinessHoursEnd(currentBranch.business_hours_end || '22:00');
    }
  }, [currentBrand, currentBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl,
          address,
          phone,
          email,
          business_hours_start: businessHoursStart,
          business_hours_end: businessHoursEnd,
        }),
      });

      if (response.ok) {
        toast.success('저장되었습니다.');
        await refreshContext();
      } else {
        toast.error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>비즈니스 정보</CardTitle>
        <CardDescription>업체의 기본 정보를 설정합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label className='text-xs text-muted-foreground'>업체명</Label>
              <p className='text-sm py-2 px-3 border rounded-md bg-muted'>
                {currentBrand?.name || '-'}
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-xs text-muted-foreground'>이메일</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='이메일을 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone' className='text-xs text-muted-foreground'>연락처</Label>
              <Input
                id='phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='연락처를 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='address' className='text-xs text-muted-foreground'>주소</Label>
              <Input
                id='address'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder='주소를 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='business_hours_start' className='text-xs text-muted-foreground'>영업 시작 시간</Label>
              <Input
                id='business_hours_start'
                type='time'
                value={businessHoursStart}
                onChange={(e) => setBusinessHoursStart(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='business_hours_end' className='text-xs text-muted-foreground'>영업 종료 시간</Label>
              <Input
                id='business_hours_end'
                type='time'
                value={businessHoursEnd}
                onChange={(e) => setBusinessHoursEnd(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label className='text-xs text-muted-foreground'>로고</Label>
              <ImageUpload
                value={logoUrl}
                onChange={(url) => setLogoUrl(url || '')}
                folder='logos'
                variant='rectangle'
              />
            </div>
          </div>
          <div className='flex justify-end'>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
