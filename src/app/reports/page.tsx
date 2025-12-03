import {
  getSalesByMenu,
  getInventoryReport,
  getLowStockIngredients,
  getMenuAnalysis,
  getTopMenus,
  getStockMovements,
  getStockMovementsSummary,
} from '@/utils/supabase/supabase';
import ReportsContent from './_components/ReportsContent';

export const revalidate = 0;

export default async function ReportsPage() {
  // 기본 날짜 범위: 최근 30일
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  // 병렬로 모든 데이터 가져오기
  const [
    salesByMenu,
    inventory,
    lowStock,
    menuAnalysis,
    topMenus,
    stockMovements,
    movementsSummary,
  ] = await Promise.all([
    getSalesByMenu(startDate, endDate),
    getInventoryReport(),
    getLowStockIngredients(10),
    getMenuAnalysis(),
    getTopMenus(10),
    getStockMovements(startDate, endDate),
    getStockMovementsSummary(startDate, endDate),
  ]);

  return (
    <ReportsContent
      salesByMenu={salesByMenu}
      inventory={inventory}
      lowStock={lowStock}
      menuAnalysis={menuAnalysis}
      topMenus={topMenus}
      stockMovements={stockMovements}
      movementsSummary={movementsSummary}
      dateRange={{ startDate, endDate }}
    />
  );
}
