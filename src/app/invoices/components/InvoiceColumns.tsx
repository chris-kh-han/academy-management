'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge, DeliveryStatusBadge } from './InvoiceStatusBadge';
import type { Invoice } from '@/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export function getInvoiceColumns(): ColumnDef<Invoice>[] {
  return [
    {
      accessorKey: 'invoice_no',
      header: ({ column }) => (
        <Button
          variant='ghost'
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          명세서번호
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const invoiceNo = row.getValue('invoice_no') as string | null;
        return (
          <Link
            href={`/invoices/${row.original.id}`}
            className='text-primary font-medium underline-offset-4 hover:underline'
          >
            {invoiceNo || `INV-${row.original.id.slice(0, 8)}`}
          </Link>
        );
      },
    },
    {
      id: 'supplier_name',
      header: ({ column }) => (
        <Button
          variant='ghost'
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          공급업체
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      accessorFn: (row) => row.supplier?.name ?? '-',
      cell: ({ row }) => <div>{row.original.supplier?.name ?? '-'}</div>,
    },
    {
      accessorKey: 'invoice_date',
      header: ({ column }) => (
        <Button
          variant='ghost'
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          수신일
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-muted-foreground'>
          {formatDate(row.getValue('invoice_date'))}
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: ({ column }) => (
        <Button
          variant='ghost'
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          금액
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue('total_amount') as number;
        return (
          <div className='font-medium'>
            {amount ? formatCurrency(amount) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === value;
      },
    },
    {
      accessorKey: 'delivery_status',
      header: '배송',
      cell: ({ row }) => (
        <DeliveryStatusBadge status={row.original.delivery_status} />
      ),
    },
  ];
}
