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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useIsMobile } from '@/hooks/use-mobile';
import type { MovementType } from '@/types';

export type Ingredient = {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  category: string;
  specification: string | null;
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
): { label: string; className: string; rowClassName: string } {
  const reorder = reorderPoint ?? 0;
  const safety = safetyStock ?? 0;

  // 품절
  if (currentQty <= 0) {
    return {
      label: '품절',
      className: 'bg-red-100 text-red-700',
      rowClassName: 'bg-red-50 hover:bg-red-100',
    };
  }

  // 현재재고 < 재주문점 → 위험
  if (currentQty < reorder) {
    return {
      label: '위험',
      className: 'bg-red-100 text-red-700',
      rowClassName: 'bg-red-50 hover:bg-red-100',
    };
  }

  // 재주문점 <= 현재재고 < 안전재고 → 주의
  if (currentQty < safety) {
    return {
      label: '주의',
      className: 'bg-orange-100 text-orange-700',
      rowClassName: 'bg-orange-50 hover:bg-orange-100',
    };
  }

  // 현재재고 >= 안전재고 → 정상
  return {
    label: '정상',
    className: 'bg-green-100 text-green-700',
    rowClassName: 'bg-green-50 hover:bg-green-100',
  };
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
  onMovement?: (type: MovementType, ingredientId: string) => void;
  onEdit?: (ingredient: Ingredient) => void;
};

export function IngredientsTable({
  data,
  onMovement,
  onEdit,
}: IngredientsTableProps) {
  const isMobile = useIsMobile();
  const [selectedIngredient, setSelectedIngredient] =
    React.useState<Ingredient | null>(null);

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
        id: 'status',
        header: '',
        cell: ({ row }) => {
          const status = getStockStatus(
            row.original.current_qty,
            row.original.reorder_point,
            row.original.safety_stock,
          );
          return (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${status.className}`}
            >
              {status.label}
            </span>
          );
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
        accessorKey: 'category',
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='-ml-3'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            카테고리
            <ArrowUpDown className='h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => (
          <div className='capitalize'>{row.getValue('category') || '-'}</div>
        ),
      },
      {
        accessorKey: 'specification',
        header: '규격',
        cell: ({ row }) => (
          <div className='text-sm text-muted-foreground'>
            {row.getValue('specification') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'current_qty',
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='-ml-3'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            현재 재고
            <ArrowUpDown className='h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => {
          const qty = row.getValue('current_qty') as number;
          const unit = row.original.unit || '';
          return (
            <div>
              {qty} {unit}
            </div>
          );
        },
      },
      {
        accessorKey: 'reorder_point',
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='-ml-3'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            재주문점
            <ArrowUpDown className='h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => {
          const reorderPoint = row.getValue('reorder_point') as number | null;
          const unit = row.original.unit || '';
          return (
            <div>{reorderPoint !== null ? `${reorderPoint} ${unit}` : '-'}</div>
          );
        },
      },
      {
        accessorKey: 'safety_stock',
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='-ml-3'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            안전재고
            <ArrowUpDown className='h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => {
          const safetyStock = row.getValue('safety_stock') as number | null;
          const unit = row.original.unit || '';
          return (
            <div>{safetyStock !== null ? `${safetyStock} ${unit}` : '-'}</div>
          );
        },
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='-ml-3'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            단가
            <ArrowUpDown className='h-4 w-4' />
          </Button>
        ),
        cell: ({ row }) => {
          const price = row.getValue('price') as number;
          return (
            <div className='font-medium'>
              {price ? formatCurrency(price) : '-'}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '설정',
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
                <DropdownMenuItem
                  onClick={() => onEdit?.(ingredient)}
                  className='cursor-pointer'
                >
                  수정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onMovement?.('in', ingredient.id)}
                  className='cursor-pointer'
                >
                  입고 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('out', ingredient.id)}
                  className='cursor-pointer'
                >
                  출고 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('waste', ingredient.id)}
                  className='cursor-pointer'
                >
                  폐기 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('adjustment', ingredient.id)}
                  className='cursor-pointer'
                >
                  조정 등록
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onMovement, onEdit],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // 모바일에서 컬럼 숨기기
  React.useEffect(() => {
    if (isMobile) {
      setColumnVisibility({
        select: false,
        category: false,
        specification: false,
        reorder_point: false,
        safety_stock: false,
        price: false,
        actions: false,
      });
    } else {
      setColumnVisibility({});
    }
  }, [isMobile]);

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
      <div className='flex flex-col gap-2 py-4 md:flex-row md:items-center'>
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
          className='w-full md:max-w-sm placeholder:text-gray-400'
        />
        <div className='flex items-center justify-between md:gap-2 md:ml-auto'>
          <div className='flex items-center gap-1'>
            <span className='text-xs text-muted-foreground mr-1'>표시:</span>
            {[10, 25, 50].map((size) => (
              <button
                key={size}
                onClick={() => table.setPageSize(size)}
                className={`text-xs px-2 py-1 rounded ${
                  table.getState().pagination.pageSize === size
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {size}개
              </button>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>
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
                    specification: '규격',
                    current_qty: '현재 재고',
                    reorder_point: '재주문점',
                    safety_stock: '안전재고',
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
              table.getRowModel().rows.map((row) => {
                const status = getStockStatus(
                  row.original.current_qty,
                  row.original.reorder_point,
                  row.original.safety_stock,
                );
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() =>
                      isMobile && setSelectedIngredient(row.original)
                    }
                    className={`${status.rowClassName} ${
                      isMobile ? 'cursor-pointer' : ''
                    }`}
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
                );
              })
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

      {/* 모바일 상세 정보 모달 */}
      <Dialog
        open={!!selectedIngredient}
        onOpenChange={(open) => !open && setSelectedIngredient(null)}
      >
        <DialogContent className='sm:max-w-[500px] items-start content-start pt-8 gap-4'>
          <DialogHeader>
            <DialogTitle>{selectedIngredient?.ingredient_name}</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <div className='grid gap-3'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>카테고리</span>
                <span className='col-span-3'>
                  {selectedIngredient.category || '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>현재 재고</span>
                <span className='col-span-3'>
                  {selectedIngredient.current_qty} {selectedIngredient.unit}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>재주문점</span>
                <span className='col-span-3'>
                  {selectedIngredient.reorder_point !== null
                    ? `${selectedIngredient.reorder_point} ${selectedIngredient.unit}`
                    : '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>안전재고</span>
                <span className='col-span-3'>
                  {selectedIngredient.safety_stock !== null
                    ? `${selectedIngredient.safety_stock} ${selectedIngredient.unit}`
                    : '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>단가</span>
                <span className='col-span-3'>
                  {selectedIngredient.price
                    ? formatCurrency(selectedIngredient.price)
                    : '-'}
                </span>
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <span className='text-left text-sm font-medium'>상태</span>
                <span className='col-span-3'>
                  {(() => {
                    const status = getStockStatus(
                      selectedIngredient.current_qty,
                      selectedIngredient.reorder_point,
                      selectedIngredient.safety_stock,
                    );
                    return (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    );
                  })()}
                </span>
              </div>
              <div className='flex flex-col gap-2 mt-4'>
                <Button
                  className='w-full cursor-pointer'
                  onClick={() => {
                    onMovement?.('in', selectedIngredient.id);
                    setSelectedIngredient(null);
                  }}
                >
                  입고
                </Button>
                <Button
                  variant='outline'
                  className='w-full cursor-pointer'
                  onClick={() => {
                    onMovement?.('out', selectedIngredient.id);
                    setSelectedIngredient(null);
                  }}
                >
                  출고
                </Button>
                <Button
                  variant='outline'
                  className='w-full cursor-pointer'
                  onClick={() => {
                    onMovement?.('waste', selectedIngredient.id);
                    setSelectedIngredient(null);
                  }}
                >
                  폐기
                </Button>
                <Button
                  variant='outline'
                  className='w-full cursor-pointer'
                  onClick={() => setSelectedIngredient(null)}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
