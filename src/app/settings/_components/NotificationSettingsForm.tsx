'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { NotificationSettings } from '@/types';

interface NotificationSettingsFormProps {
  initialData: NotificationSettings | null;
}

const defaultSettings: NotificationSettings = {
  email_notifications: true,
  push_notifications: false,
  low_stock_alert: true,
  daily_sales_report: false,
  weekly_summary: true,
};

const notificationOptions = [
  {
    key: 'email_notifications' as const,
    label: '이메일 알림',
    description: '중요한 알림을 이메일로 받습니다.',
    category: 'channel',
  },
  {
    key: 'push_notifications' as const,
    label: '푸시 알림',
    description: '브라우저 푸시 알림을 받습니다.',
    category: 'channel',
  },
  {
    key: 'low_stock_alert' as const,
    label: '재고 부족 알림',
    description: '재고가 임계값 이하로 떨어지면 알림을 받습니다.',
    category: 'type',
  },
  {
    key: 'daily_sales_report' as const,
    label: '일일 매출 리포트',
    description: '매일 아침 전날 매출 요약을 받습니다.',
    category: 'type',
  },
  {
    key: 'weekly_summary' as const,
    label: '주간 요약',
    description: '매주 월요일 지난 주 요약을 받습니다.',
    category: 'type',
  },
];

export default function NotificationSettingsForm({ initialData }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialData || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/notification', {
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

  const channelOptions = notificationOptions.filter(opt => opt.category === 'channel');
  const typeOptions = notificationOptions.filter(opt => opt.category === 'type');

  return (
    <Card>
      <CardHeader>
        <CardTitle>알림 설정</CardTitle>
        <CardDescription>알림 채널과 종류를 설정합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">알림 채널</h3>
            <div className="space-y-4 rounded-lg border p-4">
              {channelOptions.map(option => (
                <div key={option.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{option.label}</Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={settings[option.key]}
                    onCheckedChange={(checked) => handleChange(option.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">알림 종류</h3>
            <div className="space-y-4 rounded-lg border p-4">
              {typeOptions.map(option => (
                <div key={option.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{option.label}</Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={settings[option.key]}
                    onCheckedChange={(checked) => handleChange(option.key, checked)}
                    disabled={!settings.email_notifications && !settings.push_notifications}
                  />
                </div>
              ))}
            </div>
            {!settings.email_notifications && !settings.push_notifications && (
              <p className="text-sm text-amber-600">
                알림을 받으려면 최소 하나의 알림 채널을 활성화해야 합니다.
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
