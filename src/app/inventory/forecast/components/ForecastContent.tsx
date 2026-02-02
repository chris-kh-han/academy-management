'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingDown, AlertTriangle, Clock, ShoppingCart } from 'lucide-react';
import type { StockMovement } from '@/types';

type Ingredient = {
  id: number;
  ingredient_id: string;
  ingredient_name: string;
  category: string | null;
  unit: string;
  current_qty: number;
  reorder_point: number | null;
  safety_stock: number | null;
};

type ForecastContentProps = {
  ingredients: Ingredient[];
  movements: StockMovement[];
};

type ForecastData = {
  ingredient: Ingredient;
  avgDailyConsumption: number;
  daysUntilReorder: number | null;
  daysUntilStockout: number | null;
  trend: 'increasing' | 'stable' | 'decreasing';
  needsReorder: boolean;
};

export function ForecastContent({
  ingredients,
  movements,
}: ForecastContentProps) {
  // 최근 30일간의 출고 데이터를 기반으로 예측 계산
  const forecastData: ForecastData[] = React.useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return ingredients.map((ingredient) => {
      // 해당 재료의 출고 내역 필터링
      const outgoingMovements = movements.filter(
        (m) =>
          m.ingredient_id === ingredient.id &&
          (m.movement_type === 'out' || m.movement_type === 'waste') &&
          m.created_at &&
          new Date(m.created_at) >= thirtyDaysAgo,
      );

      // 총 출고량 계산
      const totalOutgoing = outgoingMovements.reduce(
        (sum, m) => sum + Math.abs(m.quantity),
        0,
      );

      // 일 평균 소진량
      const avgDailyConsumption = totalOutgoing / 30;

      // 재주문점 도달까지 예상 일수
      const reorderPoint = ingredient.reorder_point ?? 0;
      const daysUntilReorder =
        avgDailyConsumption > 0
          ? Math.max(
              0,
              Math.floor(
                (ingredient.current_qty - reorderPoint) / avgDailyConsumption,
              ),
            )
          : null;

      // 품절까지 예상 일수
      const daysUntilStockout =
        avgDailyConsumption > 0
          ? Math.max(0, Math.floor(ingredient.current_qty / avgDailyConsumption))
          : null;

      // 트렌드 계산 (최근 15일 vs 이전 15일)
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const recentMovements = outgoingMovements.filter(
        (m) => m.created_at && new Date(m.created_at) >= fifteenDaysAgo,
      );
      const olderMovements = outgoingMovements.filter(
        (m) => m.created_at && new Date(m.created_at) < fifteenDaysAgo,
      );

      const recentTotal = recentMovements.reduce(
        (sum, m) => sum + Math.abs(m.quantity),
        0,
      );
      const olderTotal = olderMovements.reduce(
        (sum, m) => sum + Math.abs(m.quantity),
        0,
      );

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (recentTotal > olderTotal * 1.2) {
        trend = 'increasing';
      } else if (recentTotal < olderTotal * 0.8) {
        trend = 'decreasing';
      }

      // 발주 필요 여부
      const needsReorder =
        ingredient.current_qty <= reorderPoint ||
        (daysUntilReorder !== null && daysUntilReorder <= 7);

      return {
        ingredient,
        avgDailyConsumption,
        daysUntilReorder,
        daysUntilStockout,
        trend,
        needsReorder,
      };
    });
  }, [ingredients, movements]);

  // 발주 필요 품목 수
  const reorderNeededCount = forecastData.filter((d) => d.needsReorder).length;

  // 7일 이내 품절 예상 품목 수
  const stockoutWarningCount = forecastData.filter(
    (d) => d.daysUntilStockout !== null && d.daysUntilStockout <= 7,
  ).length;

  // 소진 증가 추세 품목 수
  const increasingTrendCount = forecastData.filter(
    (d) => d.trend === 'increasing',
  ).length;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>재고 예측</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          재료별 소진 패턴을 분석하여 발주 시점을 예측합니다.
        </p>
      </div>

      {/* KPI 카드 */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>발주 필요</CardTitle>
            <ShoppingCart className='h-4 w-4 text-orange-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {reorderNeededCount}
            </div>
            <p className='text-xs text-muted-foreground'>품목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>7일 내 품절 예상</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {stockoutWarningCount}
            </div>
            <p className='text-xs text-muted-foreground'>품목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>소진 증가 추세</CardTitle>
            <TrendingDown className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {increasingTrendCount}
            </div>
            <p className='text-xs text-muted-foreground'>품목</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>분석 대상</CardTitle>
            <Clock className='h-4 w-4 text-gray-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{ingredients.length}</div>
            <p className='text-xs text-muted-foreground'>총 품목</p>
          </CardContent>
        </Card>
      </div>

      {/* 예측 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>재고 예측 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className='text-right'>현재 재고</TableHead>
                  <TableHead className='text-right'>일평균 소진</TableHead>
                  <TableHead className='text-right'>품절 예상일</TableHead>
                  <TableHead className='text-right'>재주문 도달일</TableHead>
                  <TableHead>트렌드</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecastData
                  .sort((a, b) => {
                    // 발주 필요 품목 우선, 그 다음 품절 예상일 순
                    if (a.needsReorder && !b.needsReorder) return -1;
                    if (!a.needsReorder && b.needsReorder) return 1;
                    const daysA = a.daysUntilStockout ?? Infinity;
                    const daysB = b.daysUntilStockout ?? Infinity;
                    return daysA - daysB;
                  })
                  .map((data) => (
                    <TableRow
                      key={data.ingredient.id}
                      className={
                        data.needsReorder ? 'bg-orange-50' : undefined
                      }
                    >
                      <TableCell className='font-medium'>
                        {data.ingredient.ingredient_name}
                      </TableCell>
                      <TableCell>
                        {data.ingredient.category || '-'}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {data.ingredient.current_qty} {data.ingredient.unit}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {data.avgDailyConsumption.toFixed(1)} {data.ingredient.unit}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {data.daysUntilStockout !== null ? (
                          <span
                            className={
                              data.daysUntilStockout <= 7
                                ? 'text-red-600 font-medium'
                                : ''
                            }
                          >
                            {data.daysUntilStockout}일
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {data.daysUntilReorder !== null ? (
                          <span
                            className={
                              data.daysUntilReorder <= 7
                                ? 'text-orange-600 font-medium'
                                : ''
                            }
                          >
                            {data.daysUntilReorder}일
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            data.trend === 'increasing'
                              ? 'destructive'
                              : data.trend === 'decreasing'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {data.trend === 'increasing'
                            ? '증가'
                            : data.trend === 'decreasing'
                              ? '감소'
                              : '안정'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {data.needsReorder ? (
                          <Badge variant='destructive'>발주 필요</Badge>
                        ) : data.daysUntilStockout !== null &&
                          data.daysUntilStockout <= 14 ? (
                          <Badge variant='outline'>주의</Badge>
                        ) : (
                          <Badge
                            variant='outline'
                            className='bg-green-50 text-green-700 border-green-200'
                          >
                            정상
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
