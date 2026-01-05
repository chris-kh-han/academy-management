'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MovementType } from '@/types';

export type Ingredient = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  category: string;
  unit: string;
  price: number;
  current_qty: number;
  reorder_point: number | null;
  safety_stock: number | null;
};

// 재고 상태 계산
function getStockStatus(
  currentQty: number,
  reorderPoint: number | null,
  safetyStock: number | null,
): { label: string; className: string } {
  const reorder = reorderPoint ?? 10;
  const safety = safetyStock ?? 0;

  if (currentQty <= safety) {
    return { label: '위험', className: 'bg-red-100 text-red-700' };
  }
  if (currentQty <= reorder) {
    return { label: '부족', className: 'bg-orange-100 text-orange-700' };
  }
  return { label: '정상', className: 'bg-green-100 text-green-700' };
}

// 숫자 포맷 (원화)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

type IngredientsTableProps = {
  data: Ingredient[];
  onMovement?: (type: MovementType, ingredientId: number) => void;
};

export function IngredientsTable({ data, onMovement }: IngredientsTableProps) {
  const columns: ColumnDef<Ingredient>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label='Select all'
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Select row'
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'ingredient_name',
        header: ({ column }) => (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            재료명
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => (
          <div className='font-medium'>{row.getValue('ingredient_name')}</div>
        ),
      },
      {
        accessorKey: 'category',
        header: '카테고리',
        cell: ({ row }) => (
          <div className='capitalize'>{row.getValue('category') || '-'}</div>
        ),
      },
      {
        accessorKey: 'current_qty',
        header: ({ column }) => (
          <div className='text-center'>
            <Button
              variant='ghost'
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              현재 재고
              <ArrowUpDown className='ml-2 h-4 w-4' />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const qty = row.getValue('current_qty') as number;
          const unit = row.original.unit || '';
          return (
            <div className='text-center'>
              {qty} {unit}
            </div>
          );
        },
      },
      {
        accessorKey: 'reorder_point',
        header: '재주문점',
        cell: ({ row }) => {
          const reorderPoint = row.getValue('reorder_point') as number | null;
          const unit = row.original.unit || '';
          return (
            <div className='text-center'>
              {reorderPoint !== null ? `${reorderPoint} ${unit}` : '-'}
            </div>
          );
        },
      },
      {
        id: 'status',
        header: '상태',
        cell: ({ row }) => {
          const status = getStockStatus(
            row.original.current_qty,
            row.original.reorder_point,
            row.original.safety_stock,
          );
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'price',
        header: '단가',
        cell: ({ row }) => {
          const price = row.getValue('price') as number;
          return (
            <div className='text-center font-medium'>
              {price ? formatCurrency(price) : '-'}
            </div>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          const ingredient = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>메뉴 열기</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>작업</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(ingredient.ingredient_id)
                  }
                >
                  ID 복사
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onMovement?.('in', Number(ingredient.id))}
                >
                  입고 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('out', Number(ingredient.id))}
                >
                  출고 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('waste', Number(ingredient.id))}
                >
                  폐기 등록
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onMovement],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex items-center py-4'>
        <Input
          placeholder='재료명 검색...'
          value={
            (table.getColumn('ingredient_name')?.getFilterValue() as string) ??
            ''
          }
          onChange={(event) =>
            table.getColumn('ingredient_name')?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              컬럼 <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const columnNames: Record<string, string> = {
                  ingredient_name: '재료명',
                  category: '카테고리',
                  current_qty: '현재 재고',
                  reorder_point: '재주문점',
                  status: '상태',
                  price: '단가',
                };
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnNames[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className='overflow-hidden rounded-md border bg-white'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
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
                  className='h-24 text-center'
                >
                  등록된 재료가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} /{' '}
          {table.getFilteredRowModel().rows.length} 개 선택됨
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            이전
          </Button>
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
