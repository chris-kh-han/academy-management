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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type SalesReportProps = {
  salesByMenu: {
    menu_id: number;
    menu_name: string;
    category: string;
    total_sales: number;
    sales_count: number;
  }[];
  topMenus: {
    menu_id: number;
    menu_name: string;
    category: string;
    total_sales: number;
    sales_count: number;
  }[];
};

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
];

export default function SalesReport({
  salesByMenu,
  topMenus,
}: SalesReportProps) {
  // 총 매출 계산
  const totalSales = salesByMenu.reduce(
    (sum, item) => sum + item.total_sales,
    0,
  );
  const totalCount = salesByMenu.reduce(
    (sum, item) => sum + item.sales_count,
    0,
  );

  // 카테고리별 매출 집계
  const categoryMap = new Map<
    string,
    { category: string; total_sales: number; sales_count: number }
  >();
  salesByMenu.forEach((item) => {
    const existing = categoryMap.get(item.category);
    if (existing) {
      existing.total_sales += item.total_sales;
      existing.sales_count += item.sales_count;
    } else {
      categoryMap.set(item.category, {
        category: item.category,
        total_sales: item.total_sales,
        sales_count: item.sales_count,
      });
    }
  });
  const categoryData = Array.from(categoryMap.values());

  // 상위 10개 메뉴 차트 데이터
  const top10ChartData = salesByMenu.slice(0, 10).map((item) => ({
    name:
      item.menu_name.length > 8
        ? item.menu_name.slice(0, 8) + '...'
        : item.menu_name,
    매출액: item.total_sales,
    판매량: item.sales_count,
  }));

  return (
    <div className='space-y-6'>
      {/* 요약 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>총 매출</CardDescription>
            <CardTitle className='text-2xl'>
              {totalSales.toLocaleString()}원
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>총 판매량</CardDescription>
            <CardTitle className='text-2xl'>
              {totalCount.toLocaleString()}개
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>평균 객단가</CardDescription>
            <CardTitle className='text-2xl'>
              {totalCount > 0
                ? Math.round(totalSales / totalCount).toLocaleString()
                : 0}
              원
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 메뉴별 매출 Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>메뉴별 매출 Top 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={top10ChartData} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis type='number' />
                  <YAxis dataKey='name' type='category' width={80} />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Bar dataKey='매출액' fill='#8884d8' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리별 Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 매출 비중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='total_sales'
                    nameKey='category'
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toLocaleString()}원`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>메뉴별 매출 상세</CardTitle>
          <CardDescription>판매량 기준 내림차순</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'>순위</TableHead>
                <TableHead>메뉴명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className='text-right'>판매량</TableHead>
                <TableHead className='text-right'>매출액</TableHead>
                <TableHead className='text-right'>비중</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topMenus.map((item, index) => (
                <TableRow key={item.menu_id}>
                  <TableCell className='font-medium'>{index + 1}</TableCell>
                  <TableCell>{item.menu_name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className='text-right'>
                    {item.sales_count.toLocaleString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    {item.total_sales.toLocaleString()}원
                  </TableCell>
                  <TableCell className='text-right'>
                    {totalSales > 0
                      ? ((item.total_sales / totalSales) * 100).toFixed(1)
                      : 0}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
