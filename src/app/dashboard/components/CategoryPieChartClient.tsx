'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Cell } from 'recharts';
import { PieChartIcon } from 'lucide-react';
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
    loading: () => <Skeleton className='h-[280px] w-full' />
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

const COLORS = [
  '#F97316', // orange-500
  '#FB923C', // orange-400
  '#FDBA74', // orange-300
  '#FED7AA', // orange-200
  '#EA580C', // orange-600
  '#C2410C', // orange-700
  '#9A3412', // orange-800
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
    <Card className='liquid-glass liquid-glass-hover rounded-2xl'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <div className='rounded-lg bg-orange-100 p-1.5'>
              <PieChartIcon className='h-4 w-4 text-orange-600' />
            </div>
            카테고리별 매출
          </CardTitle>
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_7_30}
          />
        </div>
        <CardDescription className='text-xs'>최근 {period}일간 매출 비중</CardDescription>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='h-[280px] flex items-center justify-center'>
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
                outerRadius={90}
                innerRadius={50}
                fill='#8884d8'
                dataKey='total'
                nameKey='category'
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                verticalAlign='bottom'
                height={36}
                iconType='circle'
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
