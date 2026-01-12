'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InventoryReportProps = {
  inventory: any[];
  lowStock: any[];
};

export default function InventoryReport({
  inventory,
  lowStock,
}: InventoryReportProps) {
  // 카테고리별 재고 현황
  const categoryMap = new Map<
    string,
    { category: string; count: number; totalStock: number }
  >();
  inventory.forEach((item) => {
    const cat = item.category || '미분류';
    const existing = categoryMap.get(cat);
    if (existing) {
      existing.count += 1;
      existing.totalStock += item.current_stock || 0;
    } else {
      categoryMap.set(cat, {
        category: cat,
        count: 1,
        totalStock: item.current_stock || 0,
      });
    }
  });
  const categoryData = Array.from(categoryMap.values());

  // 재고 현황 차트 데이터 (상위 15개)
  const stockChartData = [...inventory]
    .sort((a, b) => (b.current_stock || 0) - (a.current_stock || 0))
    .slice(0, 15)
    .map((item) => ({
      name:
        item.ingredient_name?.length > 6
          ? item.ingredient_name.slice(0, 6) + '...'
          : item.ingredient_name || 'Unknown',
      현재재고: item.current_stock || 0,
    }));

  return (
    <div className='space-y-6'>
      {/* 요약 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>전체 재료 수</CardDescription>
            <CardTitle className='text-2xl'>{inventory.length}개</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>카테고리 수</CardDescription>
            <CardTitle className='text-2xl'>{categoryData.length}개</CardTitle>
          </CardHeader>
        </Card>
        <Card className={lowStock.length > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className='pb-2'>
            <CardDescription>재고 부족 품목</CardDescription>
            <CardTitle
              className={`text-2xl ${lowStock.length > 0 ? 'text-red-600' : ''}`}
            >
              {lowStock.length}개
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>총 재고량</CardDescription>
            <CardTitle className='text-2xl'>
              {inventory
                .reduce((sum, i) => sum + (i.current_stock || 0), 0)
                .toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 재고 부족 알림 */}
      {lowStock.length > 0 && (
        <Card className='border-red-300 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-red-700'>재고 부족 경고</CardTitle>
            <CardDescription className='text-red-600'>
              아래 재료들의 재고가 임계치(10) 이하입니다. 빠른 발주가 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className='text-right'>현재 재고</TableHead>
                  <TableHead>단위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((item) => (
                  <TableRow key={item.ingredient_id}>
                    <TableCell className='font-medium text-red-700'>
                      {item.ingredient_name}
                    </TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell className='text-right text-red-600 font-bold'>
                      {item.current_stock?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 재고 현황 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>재고 현황 Top 15</CardTitle>
          <CardDescription>현재 재고량 기준</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-[400px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={stockChartData} layout='vertical'>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' />
                <YAxis dataKey='name' type='category' width={70} />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Bar dataKey='현재재고' fill='#82ca9d' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 전체 재고 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 재고 현황</CardTitle>
          <CardDescription>품목명 기준 정렬</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='max-h-[500px] overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className='text-right'>현재 재고</TableHead>
                  <TableHead>단위</TableHead>
                  <TableHead className='text-right'>단가</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow
                    key={item.ingredient_id}
                    className={
                      item.current_stock < 10 ? 'bg-red-50 text-red-700' : ''
                    }
                  >
                    <TableCell className='font-medium'>
                      {item.ingredient_name}
                    </TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell className='text-right'>
                      {item.current_stock?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                    <TableCell className='text-right'>
                      {item.unit_price?.toLocaleString() || 0}원
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
