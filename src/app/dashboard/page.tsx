import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import SalesKPICards from './components/SalesKPICards';
import SalesTrendChart from './components/SalesTrendChart';
import TopMenusChart from './components/TopMenusChart';
import CategoryPieChart from './components/CategoryPieChart';
import LowStockList from './components/LowStockList';
import RecentMovements from './components/RecentMovements';
import {
  KPISkeleton,
  ChartSkeleton,
  ListSkeleton,
  TableSkeleton,
} from './components/Skeletons';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
  ] = await Promise.all([supabase.auth.getUser(), minDelay()]);

  if (!user) {
    redirect('/');
  }

  return (
    <div className='px-12 py-8 animate-slide-in-left space-y-8'>
      {/* 1. 핵심 지표 카드 - Priority 1 */}
      <Suspense fallback={<KPISkeleton />}>
        <SalesKPICards />
      </Suspense>

      {/* 2. 차트 섹션 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Suspense fallback={<ChartSkeleton />}>
          <SalesTrendChart />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <TopMenusChart />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <CategoryPieChart />
        </Suspense>

        <Suspense fallback={<ListSkeleton />}>
          <LowStockList />
        </Suspense>
      </div>

      {/* 3. 최근 입출고 내역 - Below fold */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentMovements />
      </Suspense>
    </div>
  );
}
