'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  AlertTriangle,
  PackageX,
  ArrowUpDown,
  ArrowRight,
  TrendingUp,
  ShoppingCart,
  Warehouse,
  ScanLine,
} from 'lucide-react';
import { MovementsSummary } from './MovementsSummary';
// bundle-dynamic-imports: 모달은 클릭 전까지 불필요하므로 동적 로드
const InvoiceScanDialog = dynamic(
  () =>
    import('./InvoiceScanDialog').then((m) => ({
      default: m.InvoiceScanDialog,
    })),
  { ssr: false },
);
import type { MovementType } from '@/types';

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  current_qty: number;
};

type InventoryDashboardProps = {
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayMovementsCount: number;
  summary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
  lowStockItems: {
    id: string;
    name: string;
    currentQty: number;
    reorderPoint: number;
    unit: string;
  }[];
  recentMovements: {
    id: number;
    ingredient_name: string;
    movement_type: string;
    quantity: number;
    created_at: string;
  }[];
  ingredientOptions: IngredientOption[];
};

// js-cache-function-results: formatter 인스턴스 캐싱
const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
});
const formatCurrency = (value: number) => currencyFormatter.format(value);

// 이동 타입 라벨
const movementTypeLabels: Record<string, { label: string; className: string }> =
  {
    in: { label: '입고', className: 'bg-green-100 text-green-700' },
    out: { label: '출고', className: 'bg-blue-100 text-blue-700' },
    waste: { label: '폐기', className: 'bg-red-100 text-red-700' },
    adjustment: { label: '조정', className: 'bg-yellow-100 text-yellow-700' },
  };

// 날짜 포맷
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export function InventoryDashboard({
  totalValue,
  lowStockCount,
  outOfStockCount,
  todayMovementsCount,
  summary,
  lowStockItems,
  recentMovements,
  ingredientOptions,
}: InventoryDashboardProps) {
  const [invoiceScanOpen, setInvoiceScanOpen] = React.useState(false);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>재고 현황</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            재고 상태를 한눈에 확인합니다.
          </p>
        </div>
        <div className='grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto'>
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer'
            onClick={() => setInvoiceScanOpen(true)}
          >
            <ScanLine className='mr-1.5 h-4 w-4' />
            스캔
          </Button>
          <Link href='/inventory/ingredients' className='contents'>
            <Button variant='outline' size='sm' className='cursor-pointer'>
              <Warehouse className='mr-1.5 h-4 w-4' />
              재료
            </Button>
          </Link>
          <Link href='/orders' className='contents'>
            <Button size='sm' className='cursor-pointer'>
              <ShoppingCart className='mr-1.5 h-4 w-4' />
              발주
            </Button>
          </Link>
        </div>
      </div>

      <InvoiceScanDialog
        ingredients={ingredientOptions}
        open={invoiceScanOpen}
        onOpenChange={setInvoiceScanOpen}
      />

      {/* KPI 카드 */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>총 재고 금액</CardTitle>
            <Package className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(totalValue)}
            </div>
            <p className='text-muted-foreground text-xs'>현재 재고 가치</p>
          </CardContent>
        </Card>

        <Card
          className={lowStockCount > 0 ? 'border-orange-300 bg-orange-50' : ''}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>저재고 품목</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${lowStockCount > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-orange-600' : ''}`}
            >
              {lowStockCount}
            </div>
            <p className='text-muted-foreground text-xs'>발주 필요</p>
          </CardContent>
        </Card>

        <Card className={outOfStockCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>품절 품목</CardTitle>
            <PackageX
              className={`h-4 w-4 ${outOfStockCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${outOfStockCount > 0 ? 'text-red-600' : ''}`}
            >
              {outOfStockCount}
            </div>
            <p className='text-muted-foreground text-xs'>긴급 발주 필요</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>오늘 입출고</CardTitle>
            <ArrowUpDown className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{todayMovementsCount}</div>
            <p className='text-muted-foreground text-xs'>건</p>
          </CardContent>
        </Card>
      </div>

      {/* 입출고 요약 */}
      <MovementsSummary summary={summary} />

      {/* 저재고 알림 & 최근 입출고 */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* 저재고 알림 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4 text-orange-500' />
              저재고 알림
            </CardTitle>
            <Link href='/inventory/forecast'>
              <Button variant='ghost' size='sm' className='cursor-pointer'>
                전체보기
                <ArrowRight className='ml-1 h-4 w-4' />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className='space-y-3'>
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className='flex items-center justify-between rounded-lg bg-orange-50 p-3'
                  >
                    <div>
                      <p className='font-medium'>{item.name}</p>
                      <p className='text-muted-foreground text-sm'>
                        현재: {item.currentQty} {item.unit} / 재주문점:{' '}
                        {item.reorderPoint} {item.unit}
                      </p>
                    </div>
                    <Link href='/orders'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='cursor-pointer'
                      >
                        발주
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground py-8 text-center'>
                저재고 품목이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 최근 입출고 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-4 w-4 text-blue-500' />
              최근 입출고
            </CardTitle>
            <Link href='/inventory/movements'>
              <Button variant='ghost' size='sm' className='cursor-pointer'>
                전체보기
                <ArrowRight className='ml-1 h-4 w-4' />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMovements.length > 0 ? (
              <>
                {/* 모바일: 카드 레이아웃 */}
                <div className='space-y-2 md:hidden'>
                  {recentMovements.map((movement) => {
                    const typeConfig = movementTypeLabels[
                      movement.movement_type
                    ] || {
                      label: movement.movement_type,
                      className: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <div
                        key={movement.id}
                        className='bg-muted/30 flex items-center justify-between rounded-lg p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <Badge
                            variant='outline'
                            className={`${typeConfig.className} text-xs`}
                          >
                            {typeConfig.label}
                          </Badge>
                          <div>
                            <p className='text-sm font-medium'>
                              {movement.ingredient_name}
                            </p>
                            <p className='text-muted-foreground text-xs tabular-nums'>
                              {formatTime(movement.created_at)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-bold tabular-nums ${
                            movement.movement_type === 'in'
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {movement.movement_type === 'in' ? '+' : '-'}
                          {movement.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* 데스크톱: 테이블 레이아웃 */}
                <Table className='hidden md:table'>
                  <TableHeader>
                    <TableRow>
                      <TableHead>일시</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>품목</TableHead>
                      <TableHead className='text-right'>수량</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMovements.map((movement) => {
                      const typeConfig = movementTypeLabels[
                        movement.movement_type
                      ] || {
                        label: movement.movement_type,
                        className: 'bg-gray-100 text-gray-700',
                      };
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className='text-muted-foreground text-sm tabular-nums'>
                            {formatTime(movement.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant='outline'
                              className={typeConfig.className}
                            >
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className='font-medium'>
                            {movement.ingredient_name}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {movement.movement_type === 'in' ? '+' : '-'}
                            {movement.quantity}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className='text-muted-foreground py-8 text-center'>
                최근 입출고 내역이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
