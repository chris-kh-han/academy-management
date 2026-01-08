'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Award } from 'lucide-react';
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
    <Card className='liquid-glass liquid-glass-hover rounded-2xl'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold'>
            <div className='rounded-lg bg-amber-100 p-1.5'>
              <Award className='h-4 w-4 text-amber-600' />
            </div>
            인기 메뉴 TOP 5
          </CardTitle>
          <PeriodToggle
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_7_30}
          />
        </div>
        <CardDescription className='text-xs'>최근 {period}일 판매 수량 기준</CardDescription>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='h-[280px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data} layout='vertical' barCategoryGap='20%'>
              <XAxis
                type='number'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
              />
              <YAxis
                type='category'
                dataKey='menu_name'
                width={90}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#555' }}
              />
              <Tooltip
                formatter={(value) => [`${value}개`, '판매량']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Bar
                dataKey='sales_count'
                fill='#FB923C'
                radius={[0, 6, 6, 0]}
                background={{ fill: '#f5f5f5', radius: 6 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
