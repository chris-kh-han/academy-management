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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StockMovement, MovementType } from '@/types';

// 이동 타입 라벨 및 스타일
const movementTypeConfig: Record<
  MovementType,
  { label: string; className: string }
> = {
  in: { label: '입고', className: 'bg-green-100 text-green-700' },
  out: { label: '출고', className: 'bg-blue-100 text-blue-700' },
  waste: { label: '폐기', className: 'bg-red-100 text-red-700' },
  adjustment: { label: '조정', className: 'bg-yellow-100 text-yellow-700' },
};

// 날짜 포맷
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 숫자 포맷 (원화)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

type MovementsTableProps = {
  data: StockMovement[];
  onEdit?: (movement: StockMovement) => void;
  onDelete?: (id: number) => void;
};

export function MovementsTable({ data, onEdit, onDelete }: MovementsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          일시
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-sm'>
          {formatDate(row.getValue('created_at'))}
        </div>
      ),
    },
    {
      accessorKey: 'movement_type',
      header: '유형',
      cell: ({ row }) => {
        const type = row.getValue('movement_type') as MovementType;
        const config = movementTypeConfig[type] || {
          label: type,
          className: 'bg-gray-100 text-gray-700',
        };
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true;
        return row.getValue(id) === value;
      },
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
      accessorKey: 'quantity',
      header: () => <div className='text-right'>수량</div>,
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        const unit = row.original.ingredient_unit || '';
        const type = row.original.movement_type;
        const sign = type === 'in' ? '+' : type === 'adjustment' ? '' : '-';
        const color =
          type === 'in'
            ? 'text-green-600'
            : type === 'out' || type === 'waste'
              ? 'text-red-600'
              : '';
        return (
          <div className={`text-right font-medium ${color}`}>
            {sign}
            {quantity} {unit}
          </div>
        );
      },
    },
    {
      accessorKey: 'unit_price',
      header: () => <div className='text-right'>단가</div>,
      cell: ({ row }) => {
        const price = row.getValue('unit_price') as number | undefined;
        return (
          <div className='text-right'>
            {price ? formatCurrency(price) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'total_price',
      header: () => <div className='text-right'>총액</div>,
      cell: ({ row }) => {
        const price = row.getValue('total_price') as number | undefined;
        return (
          <div className='text-right font-medium'>
            {price ? formatCurrency(price) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: '사유',
      cell: ({ row }) => (
        <div className='max-w-[150px] truncate' title={row.getValue('reason')}>
          {row.getValue('reason') || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'supplier',
      header: '공급처',
      cell: ({ row }) => <div>{row.getValue('supplier') || '-'}</div>,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const movement = row.original;

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
                  navigator.clipboard.writeText(String(movement.id))
                }
              >
                ID 복사
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(movement)}>
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                className='text-red-600'
                onClick={() => movement.id && onDelete?.(movement.id)}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // 타입 필터 적용된 데이터
  const filteredData = React.useMemo(() => {
    if (typeFilter === 'all') return data;
    return data.filter((item) => item.movement_type === typeFilter);
  }, [data, typeFilter]);

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
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4'>
        <Input
          placeholder='재료명 검색...'
          value={
            (table.getColumn('ingredient_name')?.getFilterValue() as string) ??
            ''
          }
          onChange={(event) =>
            table
              .getColumn('ingredient_name')
              ?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='유형 필터' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체</SelectItem>
            <SelectItem value='in'>입고</SelectItem>
            <SelectItem value='out'>출고</SelectItem>
            <SelectItem value='waste'>폐기</SelectItem>
            <SelectItem value='adjustment'>조정</SelectItem>
          </SelectContent>
        </Select>
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
                  created_at: '일시',
                  movement_type: '유형',
                  ingredient_name: '재료명',
                  quantity: '수량',
                  unit_price: '단가',
                  total_price: '총액',
                  reason: '사유',
                  supplier: '공급처',
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
                  className='h-24 text-center'
                >
                  등록된 재고 이동 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          총 {filteredData.length}건
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
