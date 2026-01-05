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

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
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
    loading: () => <Skeleton className='h-[300px] w-full' />
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
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            일별 매출 추이
          </CardTitle>
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_7_30}
          />
        </div>
        <CardDescription>최근 {period}일간 매출</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[300px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' tickFormatter={formatDate} />
              <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), '매출']}
                labelFormatter={(label) => formatDate(String(label))}
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
  );
}
