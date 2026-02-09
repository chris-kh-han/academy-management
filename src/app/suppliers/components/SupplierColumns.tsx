'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Supplier } from '@/types';

type SupplierColumnActions = {
  onEdit: (supplier: Supplier) => void;
  onToggleActive: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
};

export function getSupplierColumns(
  actions: SupplierColumnActions,
): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant='ghost'
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          업체명
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'business_no',
      header: '사업자번호',
      cell: ({ row }) => (
        <div className='text-muted-foreground'>
          {row.getValue('business_no') || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'contact_name',
      header: '담당자',
      cell: ({ row }) => <div>{row.getValue('contact_name') || '-'}</div>,
    },
    {
      accessorKey: 'phone',
      header: '전화번호',
      cell: ({ row }) => (
        <div className='text-muted-foreground'>
          {row.getValue('phone') || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: '상태',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={
              isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }
          >
            {isActive ? '활성' : '비활성'}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === (value === 'active');
      },
    },
    {
      id: 'actions',
      header: '관리',
      enableHiding: false,
      cell: ({ row }) => {
        const supplier = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>메뉴 열기</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => actions.onEdit(supplier)}
                className='cursor-pointer'
              >
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onToggleActive(supplier)}
                className='cursor-pointer'
              >
                {supplier.is_active ? '비활성화' : '활성화'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => actions.onDelete(supplier)}
                className='cursor-pointer text-red-600 dark:text-red-400'
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
