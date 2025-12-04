'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SystemSettings } from '@/types';

interface SystemSettingsFormProps {
  initialData: SystemSettings | null;
}

const defaultSettings: SystemSettings = {
  theme: 'system',
  language: 'ko',
  items_per_page: 10,
  currency: 'KRW',
  timezone: 'Asia/Seoul',
};

const themeOptions = [
  { value: 'light', label: '라이트 모드' },
  { value: 'dark', label: '다크 모드' },
  { value: 'system', label: '시스템 설정' },
];

const languageOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
];

const itemsPerPageOptions = [
  { value: 10, label: '10개' },
  { value: 20, label: '20개' },
  { value: 50, label: '50개' },
  { value: 100, label: '100개' },
];

const currencyOptions = [
  { value: 'KRW', label: '원화 (₩)' },
  { value: 'USD', label: '달러 ($)' },
  { value: 'JPY', label: '엔화 (¥)' },
  { value: 'EUR', label: '유로 (€)' },
];

const timezoneOptions = [
  { value: 'Asia/Seoul', label: '서울 (GMT+9)' },
  { value: 'Asia/Tokyo', label: '도쿄 (GMT+9)' },
  { value: 'America/New_York', label: '뉴욕 (GMT-5)' },
  { value: 'America/Los_Angeles', label: '로스앤젤레스 (GMT-8)' },
  { value: 'Europe/London', label: '런던 (GMT+0)' },
];

export default function SystemSettingsForm({ initialData }: SystemSettingsFormProps) {
  const [settings, setSettings] = useState<SystemSettings>(initialData || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof SystemSettings>(field: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('저장되었습니다.');
        // 테마 변경 시 즉시 적용
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (settings.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // system
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
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
        <CardTitle>시스템 설정</CardTitle>
        <CardDescription>애플리케이션의 기본 설정을 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="theme">테마</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => handleChange('theme', value as SystemSettings['theme'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="테마 선택" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">언어</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleChange('language', value as SystemSettings['language'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="items_per_page">페이지당 항목 수</Label>
              <Select
                value={settings.items_per_page.toString()}
                onValueChange={(value) => handleChange('items_per_page', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="항목 수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">통화</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => handleChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="통화 선택" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="timezone">시간대</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="시간대 선택" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
