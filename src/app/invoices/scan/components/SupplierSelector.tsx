'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Supplier } from '@/types';

type SupplierSelectorProps = {
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSelect: (supplierId: string) => void;
  newSupplierName: string;
  onNewSupplierNameChange: (name: string) => void;
  detectedSupplierName?: string;
};

export function SupplierSelector({
  suppliers,
  selectedSupplierId,
  onSelect,
  newSupplierName,
  onNewSupplierNameChange,
  detectedSupplierName,
}: SupplierSelectorProps) {
  const [isCreating, setIsCreating] = React.useState(false);

  // Auto-detect supplier from OCR result
  React.useEffect(() => {
    if (!detectedSupplierName || selectedSupplierId !== 'none') return;

    const normalizedDetected = detectedSupplierName.toLowerCase().trim();
    const matched = suppliers.find(
      (s) =>
        s.name.toLowerCase().includes(normalizedDetected) ||
        normalizedDetected.includes(s.name.toLowerCase()),
    );

    if (matched) {
      onSelect(matched.id);
    } else {
      setIsCreating(true);
      onNewSupplierNameChange(detectedSupplierName);
    }
  }, [
    detectedSupplierName,
    suppliers,
    selectedSupplierId,
    onSelect,
    onNewSupplierNameChange,
  ]);

  return (
    <div className='space-y-3'>
      <Label className='text-sm font-medium'>공급업체</Label>
      {!isCreating ? (
        <div className='flex gap-2'>
          <Select value={selectedSupplierId} onValueChange={onSelect}>
            <SelectTrigger className='flex-1'>
              <SelectValue placeholder='공급업체 선택' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>선택 안함</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setIsCreating(true)}
            aria-label='새 업체 추가'
            className='shrink-0 cursor-pointer'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <div className='space-y-2'>
          <Input
            placeholder='새 공급업체명 입력'
            value={newSupplierName}
            onChange={(e) => onNewSupplierNameChange(e.target.value)}
          />
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setIsCreating(false);
              onNewSupplierNameChange('');
            }}
            className='cursor-pointer text-xs'
          >
            기존 업체에서 선택
          </Button>
        </div>
      )}
    </div>
  );
}
