'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecipeSettings } from '@/types';

interface RecipeSettingsFormProps {
  initialData: RecipeSettings | null;
}

const defaultSettings: RecipeSettings = {
  default_margin_rate: 30,
  price_rounding_unit: 100,
  cost_calculation_method: 'average',
};

const calculationMethods = [
  { value: 'average', label: '평균 단가법', description: '모든 입고 가격의 평균으로 계산' },
  { value: 'fifo', label: '선입선출법 (FIFO)', description: '먼저 입고된 재료부터 사용' },
  { value: 'lifo', label: '후입선출법 (LIFO)', description: '나중에 입고된 재료부터 사용' },
];

const roundingOptions = [
  { value: 10, label: '10원 단위' },
  { value: 100, label: '100원 단위' },
  { value: 500, label: '500원 단위' },
  { value: 1000, label: '1,000원 단위' },
];

export default function RecipeSettingsForm({ initialData }: RecipeSettingsFormProps) {
  const [settings, setSettings] = useState<RecipeSettings>(initialData || defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = <K extends keyof RecipeSettings>(
    field: K,
    value: RecipeSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings/recipe', {
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
        <CardTitle>메뉴/레시피 설정</CardTitle>
        <CardDescription>메뉴 가격 및 원가 계산 관련 설정을 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_margin_rate">기본 마진율 (%)</Label>
              <Input
                id="default_margin_rate"
                type="number"
                min="0"
                max="100"
                value={settings.default_margin_rate}
                onChange={(e) => handleChange('default_margin_rate', parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-muted-foreground">
                새 메뉴 생성 시 적용되는 기본 마진율입니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_rounding_unit">가격 반올림 단위</Label>
              <Select
                value={settings.price_rounding_unit.toString()}
                onValueChange={(value) => handleChange('price_rounding_unit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="반올림 단위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {roundingOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                계산된 가격을 해당 단위로 반올림합니다.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>원가 계산 방식</Label>
            <div className="grid gap-3">
              {calculationMethods.map(method => (
                <div
                  key={method.value}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    settings.cost_calculation_method === method.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleChange('cost_calculation_method', method.value as RecipeSettings['cost_calculation_method'])}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border-2 ${
                        settings.cost_calculation_method === method.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
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
