import DashboardContent from './components/DashboardContent';
import {
  getSalesByPeriods,
  getDashboardSalesSummary,
  getDailySalesTrend,
  getSalesByCategory,
  getTopSellingMenus,
  getLowStockIngredients,
  getRecentStockMovements,
} from '@/utils/supabase/supabase';
import { currentUser } from '@clerk/nextjs/server';

export const revalidate = 0;

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    // return redirect('/sign-in');
  }

  // 모든 대시보드 데이터를 병렬로 가져오기
  const [
    { daySales, weekSales, monthSales },
    salesSummary,
    dailyTrend7,
    dailyTrend30,
    categoryBreakdown7,
    categoryBreakdown30,
    topMenus7,
    topMenus30,
    lowStockItems,
    recentMovements,
  ] = await Promise.all([
    getSalesByPeriods(),
    getDashboardSalesSummary(),
    getDailySalesTrend(7),
    getDailySalesTrend(30),
    getSalesByCategory(7),
    getSalesByCategory(30),
    getTopSellingMenus(5, 7),
    getTopSellingMenus(5, 30),
    getLowStockIngredients(10),
    getRecentStockMovements(5),
  ]);

  return (
    <DashboardContent
      daySales={daySales ?? []}
      weekSales={weekSales ?? []}
      monthSales={monthSales ?? []}
      salesSummary={salesSummary}
      dailyTrend7={dailyTrend7}
      dailyTrend30={dailyTrend30}
      categoryBreakdown7={categoryBreakdown7}
      categoryBreakdown30={categoryBreakdown30}
      topMenus7={topMenus7}
      topMenus30={topMenus30}
      lowStockItems={lowStockItems ?? []}
      recentMovements={recentMovements}
    />
  );
}
