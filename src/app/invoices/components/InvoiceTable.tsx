'use client';

import * as React from 'react';
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { InvoiceFilters } from './InvoiceFilters';
import { getInvoiceColumns } from './InvoiceColumns';
import type { Invoice, Supplier } from '@/types';

type InvoiceTableProps = {
  data: Invoice[];
  suppliers: Supplier[];
};

export function InvoiceTable({ data, suppliers }: InvoiceTableProps) {
  const isMobile = useIsMobile();
  const columns = React.useMemo(() => getInvoiceColumns(), []);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [supplierFilter, setSupplierFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        invoice_date: false,
        delivery_status: false,
        supplier_name: false,
      });
    } else {
      setColumnVisibility({});
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    let result = data;

    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    if (supplierFilter !== 'all') {
      result = result.filter((inv) => inv.supplier_id === supplierFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoice_no?.toLowerCase().includes(query) ||
          inv.supplier?.name?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [data, statusFilter, supplierFilter, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className='w-full space-y-4'>
      <InvoiceFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        supplierFilter={supplierFilter}
        onSupplierChange={setSupplierFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        suppliers={suppliers}
      />

      <div className='overflow-hidden rounded-md border bg-white dark:bg-gray-950'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-32 text-center'
                >
                  <div className='text-muted-foreground flex flex-col items-center gap-2'>
                    <p className='text-sm'>등록된 거래명세서가 없습니다.</p>
                    <p className='text-xs'>
                      명세서를 스캔하여 등록하거나 수동으로 추가해보세요.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between py-2'>
        <div className='text-muted-foreground text-sm'>
          총 {table.getFilteredRowModel().rows.length}건
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            이전
          </Button>
          <span className='text-muted-foreground text-sm'>
            {table.getState().pagination.pageIndex + 1} /{' '}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
