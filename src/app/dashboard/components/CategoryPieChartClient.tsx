'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PeriodToggle, { PERIOD_OPTIONS_7_30 } from '@/components/PeriodToggle';
import { Skeleton } from '@/components/ui/skeleton';

const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  {
    ssr: false,
    loading: () => <Skeleton className='h-[300px] w-full' />
  }
);

type CategoryBreakdown = {
  category: string;
  total: number;
};

type Props = {
  category7: CategoryBreakdown[];
  category30: CategoryBreakdown[];
};

// shadcn/ui 테마 기반 차트 색상
const COLORS = [
  '#E76F51', // chart-1: coral
  '#2A9D8F', // chart-2: teal
  '#264653', // chart-3: dark slate
  '#E9C46A', // chart-4: gold
  '#F4A261', // chart-5: sandy orange
  '#6366F1', // indigo (추가)
  '#EC4899', // pink (추가)
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

type TrendPeriod = 7 | 30;

export default function CategoryPieChartClient({ category7, category30 }: Props) {
  const [period, setPeriod] = useState<TrendPeriod>(30);
  const data = period === 7 ? category7 : category30;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>카테고리별 매출</CardTitle>
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_7_30}
          />
        </div>
        <CardDescription>최근 {period}일간 매출 비중</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[300px] flex items-center justify-center'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={data}
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
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
