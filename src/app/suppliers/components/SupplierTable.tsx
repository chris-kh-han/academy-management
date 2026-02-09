'use client';

import * as React from 'react';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { getSupplierColumns } from './SupplierColumns';
import type { Supplier } from '@/types';

type SupplierTableProps = {
  data: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onToggleActive: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
};

export function SupplierTable({
  data,
  onEdit,
  onToggleActive,
  onDelete,
}: SupplierTableProps) {
  const isMobile = useIsMobile();
  const [selectedSupplier, setSelectedSupplier] =
    React.useState<Supplier | null>(null);

  const columns = React.useMemo(
    () => getSupplierColumns({ onEdit, onToggleActive, onDelete }),
    [onEdit, onToggleActive, onDelete],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        business_no: false,
        contact_name: false,
        phone: false,
        actions: false,
      });
    } else {
      setColumnVisibility({});
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((s) => s.is_active === (statusFilter === 'active'));
  }, [data, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='업체명 검색...'
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className='w-full pl-9 placeholder:text-gray-400 sm:max-w-sm'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-full sm:w-[140px]'>
            <SelectValue placeholder='상태 필터' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체</SelectItem>
            <SelectItem value='active'>활성</SelectItem>
            <SelectItem value='inactive'>비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <TableRow
                  key={row.id}
                  onClick={() => isMobile && setSelectedSupplier(row.original)}
                  className={isMobile ? 'cursor-pointer' : ''}
                >
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
                    <p className='text-sm'>등록된 공급업체가 없습니다.</p>
                    <p className='text-xs'>
                      상단의 &quot;업체 추가&quot; 버튼으로 공급업체를
                      등록해보세요.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between py-4'>
        <div className='text-muted-foreground text-sm'>
          총 {table.getFilteredRowModel().rows.length}개 업체
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

      {/* Mobile detail dialog */}
      <Dialog
        open={!!selectedSupplier}
        onOpenChange={(open) => !open && setSelectedSupplier(null)}
      >
        <DialogContent className='content-start items-start gap-4 pt-8 sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>{selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className='grid gap-3'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>
                  사업자번호
                </span>
                <span className='col-span-3'>
                  {selectedSupplier.business_no || '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>담당자</span>
                <span className='col-span-3'>
                  {selectedSupplier.contact_name || '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>전화번호</span>
                <span className='col-span-3'>
                  {selectedSupplier.phone || '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>이메일</span>
                <span className='col-span-3'>
                  {selectedSupplier.email || '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>주소</span>
                <span className='col-span-3'>
                  {selectedSupplier.address || '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>상태</span>
                <span className='col-span-3'>
                  <Badge
                    variant={
                      selectedSupplier.is_active ? 'default' : 'secondary'
                    }
                    className={
                      selectedSupplier.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }
                  >
                    {selectedSupplier.is_active ? '활성' : '비활성'}
                  </Badge>
                </span>
              </div>
              {selectedSupplier.notes && (
                <div className='grid grid-cols-4 items-start gap-4'>
                  <span className='text-left text-sm font-medium'>비고</span>
                  <span className='text-muted-foreground col-span-3 text-sm'>
                    {selectedSupplier.notes}
                  </span>
                </div>
              )}
              <div className='mt-4 flex flex-col gap-2'>
                <Button
                  className='w-full cursor-pointer'
                  onClick={() => {
                    onEdit(selectedSupplier);
                    setSelectedSupplier(null);
                  }}
                >
                  수정
                </Button>
                <Button
                  variant='outline'
                  className='w-full cursor-pointer'
                  onClick={() => {
                    onToggleActive(selectedSupplier);
                    setSelectedSupplier(null);
                  }}
                >
                  {selectedSupplier.is_active ? '비활성화' : '활성화'}
                </Button>
                <Button
                  variant='outline'
                  className='w-full cursor-pointer'
                  onClick={() => setSelectedSupplier(null)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
