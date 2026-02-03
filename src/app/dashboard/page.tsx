import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  getAllIngredients,
  getStockMovements,
  getStockMovementsSummary,
  getDashboardSalesSummary,
  getDailySalesTrend,
  getTopSellingMenus,
  getRecentStockMovements,
} from '@/utils/supabase/supabase';
import InventoryKPICards from './components/InventoryKPICards';
import SalesKPICards from './components/SalesKPICards';
import ReorderAlerts from './components/ReorderAlerts';
import SalesTrendChart from './components/SalesTrendChart';
import TopMenusChart from './components/TopMenusChart';
import RecentMovements from './components/RecentMovements';
import DashboardContent from './components/DashboardContent';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    ingredients,
    movements,
    movementsSummary,
    salesSummary,
    trend7,
    trend30,
    topMenus7,
    topMenus30,
    recentMovements,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getAllIngredients(),
    getStockMovements(),
    getStockMovementsSummary(),
    getDashboardSalesSummary(),
    getDailySalesTrend(7),
    getDailySalesTrend(30),
    getTopSellingMenus(5, 7),
    getTopSellingMenus(5, 30),
    getRecentStockMovements(5),
  ]);

  if (!user) {
    redirect('/');
  }

  return (
    <DashboardContent>
      <div className='animate-slide-in-left space-y-8 px-12 py-8'>
        {/* 1. 재고 KPI 카드 - Priority 1 (재고 중심) */}
        <InventoryKPICards
          ingredients={ingredients}
          movements={movements}
          summary={movementsSummary}
        />

        {/* 2. 저재고 알림 & 최근 입출고 */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <ReorderAlerts ingredients={ingredients} />
          <RecentMovements movements={recentMovements} />
        </div>

        {/* 3. 매출 KPI 카드 */}
        <SalesKPICards salesSummary={salesSummary} ingredients={ingredients} />

        {/* 4. 차트 섹션 */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <SalesTrendChart trend7={trend7} trend30={trend30} />
          <TopMenusChart topMenus7={topMenus7} topMenus30={topMenus30} />
        </div>
      </div>
    </DashboardContent>
  );
}
