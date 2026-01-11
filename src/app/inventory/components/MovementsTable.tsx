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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 || 12;
  const hourStr = String(hour12).padStart(2, '0');
  return {
    datePart: `${year}. ${month}. ${day}.`,
    ampm,
    time: `${hourStr}:${minutes}`,
  };
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
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
};

export function MovementsTable({
  data,
  onEdit,
  onDelete,
  typeFilter: externalTypeFilter,
  onTypeFilterChange,
}: MovementsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [internalTypeFilter, setInternalTypeFilter] =
    React.useState<string>('all');

  const typeFilter = externalTypeFilter ?? internalTypeFilter;
  const handleTypeFilterChange = (value: string) => {
    if (onTypeFilterChange) {
      onTypeFilterChange(value);
    } else {
      setInternalTypeFilter(value);
    }
  };

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant='ghost'
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          일시
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const { datePart, ampm, time } = formatDate(row.getValue('created_at'));
        return (
          <div className='text-sm tabular-nums'>
            {datePart} <span className='inline-block w-6'>{ampm}</span> {time}
          </div>
        );
      },
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
            className={`px-2 py-1 rounded text-xs font-medium config.className}`}
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
          className='-ml-3'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          재료명
          <ArrowUpDown className='h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('ingredient_name')}</div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: '수량',
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        const unit = row.original.ingredient_unit || '';
        const type = row.original.movement_type;
        const previousQty = row.original.previous_qty;
        const resultingQty = row.original.resulting_qty;

        let sign = '';
        let color = '';

        if (type === 'in') {
          sign = '+';
          color = 'text-green-600';
        } else if (type === 'out' || type === 'waste') {
          sign = '-';
          color = 'text-red-600';
        } else if (type === 'adjustment') {
          // 조정은 quantity 값의 부호에 따라 표시
          sign = quantity >= 0 ? '+' : '';
          color = quantity >= 0 ? 'text-green-600' : 'text-red-600';
        }

        // 조정 타입이고 이전/결과 수량이 있으면 상세 표시
        if (
          type === 'adjustment' &&
          previousQty !== undefined &&
          resultingQty !== undefined
        ) {
          return (
            <div className='text-xs'>
              <span className='text-muted-foreground'>{previousQty}</span>
              <span className={`font-medium mx-1 ${color}`}>
                {sign}
                {quantity}
              </span>
              <span>{'->'}</span>
              <span className='ml-1'>{resultingQty}</span>
              <span className='text-muted-foreground ml-1'>{unit}</span>
            </div>
          );
        }

        return (
          <div className={`font-medium ${color}`}>
            {sign}
            {quantity} {unit}
          </div>
        );
      },
    },
    {
      accessorKey: 'unit_price',
      header: '단가',
      cell: ({ row }) => {
        const price = row.getValue('unit_price') as number | undefined;
        return <div>{price ? formatCurrency(price) : '-'}</div>;
      },
    },
    {
      accessorKey: 'total_price',
      header: '총액',
      cell: ({ row }) => {
        const price = row.getValue('total_price') as number | undefined;
        return (
          <div className='font-medium'>
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
      cell: ({ row }) => (
        <div className='text-left'>{row.getValue('supplier') || '-'}</div>
      ),
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
        <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
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
