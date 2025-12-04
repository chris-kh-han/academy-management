'use client';

import { useState } from 'react';
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
import type { BusinessSettings } from '@/types';

interface BusinessSettingsFormProps {
  initialData: BusinessSettings | null;
}

const defaultSettings: BusinessSettings = {
  business_name: '',
  address: '',
  phone: '',
  email: '',
  business_hours_start: '09:00',
  business_hours_end: '22:00',
  logo_url: '',
};

export default function BusinessSettingsForm({
  initialData,
}: BusinessSettingsFormProps) {
  const [settings, setSettings] = useState<BusinessSettings>(
    initialData || defaultSettings,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof BusinessSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('저장되었습니다.');
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('저장 중 오류가 발생했습니다.');
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
              <Label htmlFor='business_name'>업체명</Label>
              <Input
                id='business_name'
                value={settings.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder='업체명을 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder='이메일을 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>연락처</Label>
              <Input
                id='phone'
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder='연락처를 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='address'>주소</Label>
              <Input
                id='address'
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder='주소를 입력하세요'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='business_hours_start'>영업 시작 시간</Label>
              <Input
                id='business_hours_start'
                type='time'
                value={settings.business_hours_start}
                onChange={(e) =>
                  handleChange('business_hours_start', e.target.value)
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='business_hours_end'>영업 종료 시간</Label>
              <Input
                id='business_hours_end'
                type='time'
                value={settings.business_hours_end}
                onChange={(e) =>
                  handleChange('business_hours_end', e.target.value)
                }
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='logo_url'>로고 URL</Label>
            <Input
              id='logo_url'
              value={settings.logo_url || ''}
              onChange={(e) => handleChange('logo_url', e.target.value)}
              placeholder='로고 이미지 URL을 입력하세요'
            />
          </div>
          <Button type='submit' disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
