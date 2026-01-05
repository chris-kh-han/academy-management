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

const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
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

type TopMenu = {
  menu_id: number;
  menu_name: string;
  category: string;
  total_sales: number;
  sales_count: number;
};

type Props = {
  topMenus7: TopMenu[];
  topMenus30: TopMenu[];
};

type TrendPeriod = 7 | 30;

export default function TopMenusChartClient({ topMenus7, topMenus30 }: Props) {
  const [period, setPeriod] = useState<TrendPeriod>(30);
  const data = period === 7 ? topMenus7 : topMenus30;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5' />
            인기 메뉴 TOP 5
          </CardTitle>
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_7_30}
          />
        </div>
        <CardDescription>최근 {period}일 판매 수량 기준</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-[300px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} layout='vertical'>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis type='number' />
              <YAxis
                type='category'
                dataKey='menu_name'
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value) => [`${value}개`, '판매량']} />
              <Bar dataKey='sales_count' fill='#00C49F' radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
