'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PeriodToggle, { PERIOD_OPTIONS_7_30 } from '@/components/PeriodToggle';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types
type Sale = {
  menu_name: string;
  total_sales: number;
  sales_count: number;
  [key: string]: unknown;
};

type SalesSummary = {
  yesterday: { total: number; change: number };
  week: { total: number; change: number };
  month: { total: number; change: number };
};

type DailyTrend = {
  date: string;
  total: number;
  count: number;
};

type CategoryBreakdown = {
  category: string;
  total: number;
};

type TopMenu = {
  menu_id: number;
  menu_name: string;
  category: string;
  total_sales: number;
  sales_count: number;
};

type LowStockItem = {
  ingredient_id: number;
  ingredient_name: string;
  current_stock: number;
  unit: string;
};

type StockMovement = {
  id: number;
  ingredient_name: string;
  movement_type: string;
  quantity: number;
  created_at: string;
};

type DashboardContentProps = {
  daySales: Sale[];
  weekSales: Sale[];
  monthSales: Sale[];
  salesSummary: SalesSummary;
  dailyTrend7: DailyTrend[];
  dailyTrend30: DailyTrend[];
  categoryBreakdown7: CategoryBreakdown[];
  categoryBreakdown30: CategoryBreakdown[];
  topMenus7: TopMenu[];
  topMenus30: TopMenu[];
  lowStockItems: LowStockItem[];
  recentMovements: StockMovement[];
};

// 색상 팔레트
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// 숫자 포맷 (원화)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

// 날짜 포맷 (MM/DD)
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 증감률 표시 컴포넌트
function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change >= 0;
  return (
    <div
      className={`flex items-center gap-1 text-sm ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className='h-4 w-4' />
      ) : (
        <ArrowDownRight className='h-4 w-4' />
      )}
      <span>{Math.abs(change)}%</span>
    </div>
  );
}

type TrendPeriod = 7 | 30;

export default function DashboardContent({
  salesSummary,
  dailyTrend7,
  dailyTrend30,
  categoryBreakdown7,
  categoryBreakdown30,
  topMenus7,
  topMenus30,
  lowStockItems,
  recentMovements,
}: DashboardContentProps) {
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>(7);
  const [topMenusPeriod, setTopMenusPeriod] = useState<TrendPeriod>(30);
  const [categoryPeriod, setCategoryPeriod] = useState<TrendPeriod>(30);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const dailyTrend = trendPeriod === 7 ? dailyTrend7 : dailyTrend30;
  const topMenus = topMenusPeriod === 7 ? topMenus7 : topMenus30;
  const categoryBreakdown =
    categoryPeriod === 7 ? categoryBreakdown7 : categoryBreakdown30;

  const handleCategoryPeriodChange = (period: TrendPeriod) => {
    if (period === categoryPeriod) return;
    setCategoryLoading(true);
    setCategoryPeriod(period);
  };

  useEffect(() => {
    if (categoryLoading) {
      const timer = setTimeout(() => setCategoryLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [categoryLoading]);

  return (
    <div className='p-4 md:p-6 space-y-6'>
      {/* 1. 핵심 지표 카드 */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* 어제 매출 */}
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>어제 매출</CardDescription>
            <CardTitle className='text-2xl'>
              {formatCurrency(salesSummary.yesterday.total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangeIndicator change={salesSummary.yesterday.change} />
            <p className='text-xs text-muted-foreground'>전일 대비</p>
          </CardContent>
        </Card>

        {/* 주간 매출 */}
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>주간 매출</CardDescription>
            <CardTitle className='text-2xl'>
              {formatCurrency(salesSummary.week.total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangeIndicator change={salesSummary.week.change} />
            <p className='text-xs text-muted-foreground'>전주 대비</p>
          </CardContent>
        </Card>

        {/* 월간 매출 */}
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>월간 매출</CardDescription>
            <CardTitle className='text-2xl'>
              {formatCurrency(salesSummary.month.total)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangeIndicator change={salesSummary.month.change} />
            <p className='text-xs text-muted-foreground'>전월 대비</p>
          </CardContent>
        </Card>

        {/* 재고 부족 알림 */}
        <Card className={lowStockItems.length > 0 ? 'border-orange-300' : ''}>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              {lowStockItems.length > 0 && (
                <AlertTriangle className='h-4 w-4 text-orange-500' />
              )}
              재고 부족
            </CardDescription>
            <CardTitle className='text-2xl'>{lowStockItems.length}개</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>임계치 이하 재료</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. 차트 섹션 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* 일별 매출 추이 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                일별 매출 추이
              </CardTitle>
              <PeriodToggle
                value={trendPeriod}
                onChange={setTrendPeriod}
                options={PERIOD_OPTIONS_7_30}
              />
            </div>
            <CardDescription>최근 {trendPeriod}일간 매출</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' tickFormatter={formatDate} />
                  <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      '매출',
                    ]}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Line
                    type='monotone'
                    dataKey='total'
                    stroke='#0088FE'
                    strokeWidth={2}
                    dot={{ fill: '#0088FE' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 인기 메뉴 TOP 5 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                인기 메뉴 TOP 5
              </CardTitle>
              <PeriodToggle
                value={topMenusPeriod}
                onChange={setTopMenusPeriod}
                options={PERIOD_OPTIONS_7_30}
              />
            </div>
            <CardDescription>
              최근 {topMenusPeriod}일 판매 수량 기준
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={topMenus} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis type='number' />
                  <YAxis
                    type='category'
                    dataKey='menu_name'
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}개`, '판매량']}
                  />
                  <Bar
                    dataKey='sales_count'
                    fill='#00C49F'
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리별 매출 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle>카테고리별 매출</CardTitle>
              <PeriodToggle
                value={categoryPeriod}
                onChange={handleCategoryPeriodChange}
                options={PERIOD_OPTIONS_7_30}
              />
            </div>
            <CardDescription>
              최근 {categoryPeriod}일간 매출 비중
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px] flex items-center justify-center'>
              {categoryLoading ? (
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              ) : (
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='total'
                      nameKey='category'
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 재고 부족 알림 리스트 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-orange-500' />
              재고 부족 재료
            </CardTitle>
            <CardDescription>임계치 10 이하 재료</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3 max-h-[300px] overflow-y-auto'>
              {lowStockItems.length === 0 ? (
                <p className='text-muted-foreground text-center py-8'>
                  부족한 재료가 없습니다
                </p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.ingredient_id}
                    className='flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200'
                  >
                    <span className='font-medium'>{item.ingredient_name}</span>
                    <span className='text-orange-600 font-bold'>
                      {item.current_stock} {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 최근 입출고 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            최근 입출고 내역
          </CardTitle>
          <CardDescription>최근 5건</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left py-2 px-4'>재료명</th>
                  <th className='text-left py-2 px-4'>유형</th>
                  <th className='text-right py-2 px-4'>수량</th>
                  <th className='text-right py-2 px-4'>일시</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className='text-center py-8 text-muted-foreground'
                    >
                      최근 입출고 내역이 없습니다
                    </td>
                  </tr>
                ) : (
                  recentMovements.map((movement) => (
                    <tr key={movement.id} className='border-b last:border-0'>
                      <td className='py-3 px-4'>{movement.ingredient_name}</td>
                      <td className='py-3 px-4'>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            movement.movement_type === 'in' ||
                            movement.movement_type === 'incoming'
                              ? 'bg-green-100 text-green-700'
                              : movement.movement_type === 'out' ||
                                movement.movement_type === 'outgoing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {movement.movement_type === 'in' ||
                          movement.movement_type === 'incoming'
                            ? '입고'
                            : movement.movement_type === 'out' ||
                              movement.movement_type === 'outgoing'
                            ? '출고'
                            : '폐기'}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        {movement.quantity}
                      </td>
                      <td className='py-3 px-4 text-right text-muted-foreground'>
                        {new Date(movement.created_at).toLocaleDateString(
                          'ko-KR',
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
