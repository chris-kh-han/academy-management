'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import type { InventorySettings } from '@/types';

interface InventorySettingsFormProps {
  initialData: InventorySettings | null;
}

const defaultSettings: InventorySettings = {
  low_stock_threshold: 10,
  default_unit: 'g',
  auto_reorder_enabled: false,
  auto_reorder_quantity: 100,
};

const unitOptions = [
  { value: 'g', label: '그램 (g)' },
  { value: 'kg', label: '킬로그램 (kg)' },
  { value: 'ml', label: '밀리리터 (ml)' },
  { value: 'L', label: '리터 (L)' },
  { value: 'ea', label: '개 (ea)' },
  { value: 'pack', label: '팩 (pack)' },
  { value: 'box', label: '박스 (box)' },
];

export default function InventorySettingsForm({ initialData }: InventorySettingsFormProps) {
  const [settings, setSettings] = useState<InventorySettings>(initialData || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof InventorySettings>(
    field: K,
    value: InventorySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/inventory', {
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
        <CardTitle>재고 관리 설정</CardTitle>
        <CardDescription>재고 관리에 관련된 설정을 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold" className="text-xs text-muted-foreground">재고 부족 알림 임계값</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={settings.low_stock_threshold}
                onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                재고가 이 수량 이하로 떨어지면 알림을 받습니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_unit" className="text-xs text-muted-foreground">기본 단위</Label>
              <Select
                value={settings.default_unit}
                onValueChange={(value) => handleChange('default_unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="단위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map(option => (
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
                <Label className="text-xs text-muted-foreground">자동 재주문</Label>
                <p className="text-sm text-muted-foreground">
                  재고가 부족할 때 자동으로 재주문을 생성합니다.
                </p>
              </div>
              <Switch
                checked={settings.auto_reorder_enabled}
                onCheckedChange={(checked) => handleChange('auto_reorder_enabled', checked)}
              />
            </div>
            {settings.auto_reorder_enabled && (
              <div className="space-y-2">
                <Label htmlFor="auto_reorder_quantity" className="text-xs text-muted-foreground">자동 재주문 수량</Label>
                <Input
                  id="auto_reorder_quantity"
                  type="number"
                  min="1"
                  value={settings.auto_reorder_quantity}
                  onChange={(e) => handleChange('auto_reorder_quantity', parseInt(e.target.value) || 0)}
                />
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
