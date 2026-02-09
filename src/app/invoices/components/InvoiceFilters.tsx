'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InvoiceStatus, Supplier } from '@/types';

type InvoiceFiltersProps = {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  supplierFilter: string;
  onSupplierChange: (supplierId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  suppliers: Supplier[];
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'received', label: '수신' },
  { value: 'inspecting', label: '검수중' },
  { value: 'confirmed', label: '확인' },
  { value: 'disputed', label: '이의' },
];

export function InvoiceFilters({
  statusFilter,
  onStatusChange,
  supplierFilter,
  onSupplierChange,
  searchQuery,
  onSearchChange,
  suppliers,
}: InvoiceFiltersProps) {
  return (
    <div className='space-y-4'>
      <Tabs value={statusFilter} onValueChange={onStatusChange}>
        <TabsList className='w-full sm:w-auto'>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='flex-1 sm:flex-none'
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='명세서번호 검색...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className='w-full pl-9 placeholder:text-gray-400 sm:max-w-sm'
          />
        </div>
        <Select value={supplierFilter} onValueChange={onSupplierChange}>
          <SelectTrigger className='w-full sm:w-[200px]'>
            <SelectValue placeholder='공급업체 선택' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체 업체</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
