'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PeriodToggle, { PERIOD_OPTIONS_7_30 } from '@/components/PeriodToggle';
import { Skeleton } from '@/components/ui/skeleton';

const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false }
);
const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  {
    ssr: false,
    loading: () => <Skeleton className='h-[280px] w-full' />
  }
);

type DailyTrend = {
  date: string;
  total: number;
  count: number;
};

type Props = {
  trend7: DailyTrend[];
  trend30: DailyTrend[];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

type TrendPeriod = 7 | 30;

export default function SalesTrendChartClient({ trend7, trend30 }: Props) {
  const [period, setPeriod] = useState<TrendPeriod>(7);
  const data = period === 7 ? trend7 : trend30;

  return (
    <Card className='rounded-2xl backdrop-blur-xl backdrop-saturate-150 border border-white/50 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] hover:bg-white/80'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <div className='rounded-lg bg-primary/10 p-1.5'>
              <TrendingUp className='h-4 w-4 text-primary' />
            </div>
            일별 매출 추이
          </CardTitle>
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_7_30}
          />
        </div>
        <CardDescription className='text-xs'>최근 {period}일간 매출</CardDescription>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='h-[280px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data}>
              <defs>
                <linearGradient id='salesGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#F97316' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='#F97316' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' vertical={false} />
              <XAxis
                dataKey='date'
                tickFormatter={formatDate}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
                width={45}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), '매출']}
                labelFormatter={(label) => formatDate(String(label))}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type='monotone'
                dataKey='total'
                stroke='#F97316'
                strokeWidth={2}
                fill='url(#salesGradient)'
                dot={{ fill: '#F97316', strokeWidth: 0, r: 3 }}
                activeDot={{ fill: '#F97316', strokeWidth: 0, r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
