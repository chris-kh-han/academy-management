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
import { useIsMobile } from '@/hooks/use-mobile';
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
  const reorder = reorderPoint ?? 0;
  const safety = safetyStock ?? 0;

  // 품절
  if (currentQty <= 0) {
    return { label: '품절', className: 'bg-red-100 text-red-700' };
  }

  // 현재재고 < 재주문점 → 위험
  if (currentQty < reorder) {
    return { label: '위험', className: 'bg-red-100 text-red-700' };
  }

  // 재주문점 <= 현재재고 < 안전재고 → 주의
  if (currentQty < safety) {
    return { label: '주의', className: 'bg-orange-100 text-orange-700' };
  }

  // 현재재고 >= 안전재고 → 정상
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
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
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
        accessorKey: 'safety_stock',
        header: '안전재고',
        cell: ({ row }) => {
          const safetyStock = row.getValue('safety_stock') as number | null;
          const unit = row.original.unit || '';
          return (
            <div className='text-center'>
              {safetyStock !== null ? `${safetyStock} ${unit}` : '-'}
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
                <DropdownMenuItem onClick={() => onEdit?.(ingredient)}>
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(ingredient.ingredient_id)
                  }
                >
                  ID 복사
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onMovement?.('in', ingredient.id)}
                >
                  입고 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('out', ingredient.id)}
                >
                  출고 등록
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMovement?.('waste', ingredient.id)}
                >
                  폐기 등록
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
      <div className='flex items-center gap-2 py-4'>
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
          className='max-w-sm placeholder:text-gray-400'
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
                  onClick={() =>
                    isMobile && setSelectedIngredient(row.original)
                  }
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
