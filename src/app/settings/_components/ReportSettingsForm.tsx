'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReportSettings } from '@/types';

interface ReportSettingsFormProps {
  initialData: ReportSettings | null;
}

const defaultSettings: ReportSettings = {
  default_period: 'weekly',
  auto_generate_enabled: false,
  auto_generate_frequency: 'weekly',
  export_format: 'pdf',
};

const periodOptions = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
];

const formatOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
];

export default function ReportSettingsForm({ initialData }: ReportSettingsFormProps) {
  const [settings, setSettings] = useState<ReportSettings>(initialData || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof ReportSettings>(
    field: K,
    value: ReportSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('저장되었습니다.');
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
        <CardTitle>리포트 설정</CardTitle>
        <CardDescription>리포트 생성 및 내보내기 관련 설정을 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_period">기본 조회 기간</Label>
              <Select
                value={settings.default_period}
                onValueChange={(value) => handleChange('default_period', value as ReportSettings['default_period'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기간 선택" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                리포트 페이지 접속 시 기본 조회 기간입니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export_format">기본 내보내기 형식</Label>
              <Select
                value={settings.export_format}
                onValueChange={(value) => handleChange('export_format', value as ReportSettings['export_format'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="형식 선택" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>자동 리포트 생성</Label>
                <p className="text-sm text-muted-foreground">
                  설정된 주기에 따라 자동으로 리포트를 생성합니다.
                </p>
              </div>
              <Switch
                checked={settings.auto_generate_enabled}
                onCheckedChange={(checked) => handleChange('auto_generate_enabled', checked)}
              />
            </div>
            {settings.auto_generate_enabled && (
              <div className="space-y-2">
                <Label htmlFor="auto_generate_frequency">자동 생성 주기</Label>
                <Select
                  value={settings.auto_generate_frequency}
                  onValueChange={(value) => handleChange('auto_generate_frequency', value as ReportSettings['auto_generate_frequency'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="주기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
