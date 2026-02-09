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
  getUserContext,
  getInvoiceStats,
  getRecentInvoices,
} from '@/utils/supabase/supabase';
import InvoiceKPICards from './components/InvoiceKPICards';
import InventoryKPICards from './components/InventoryKPICards';
import SalesKPICards from './components/SalesKPICards';
import ReorderAlerts from './components/ReorderAlerts';
import RecentInvoices from './components/RecentInvoices';
import SalesTrendChart from './components/SalesTrendChart';
import TopMenusChart from './components/TopMenusChart';
import RecentMovements from './components/RecentMovements';
import DashboardContent from './components/DashboardContent';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get user context to resolve branchId for invoice queries
  const userContext = await getUserContext(user.id);
  const branchId = userContext.currentBranch?.id;

  const [
    ingredients,
    movements,
    movementsSummary,
    salesSummary,
    trend7,
    trend30,
    topMenus7,
    topMenus30,
    recentMovements,
    invoiceStats,
    recentInvoices,
  ] = await Promise.all([
    getAllIngredients(),
    getStockMovements(),
    getStockMovementsSummary(),
    getDashboardSalesSummary(),
    getDailySalesTrend(7),
    getDailySalesTrend(30),
    getTopSellingMenus(5, 7),
    getTopSellingMenus(5, 30),
    getRecentStockMovements(5),
    branchId
      ? getInvoiceStats(branchId)
      : Promise.resolve({
          todayReceived: 0,
          pendingInspection: 0,
          monthConfirmedAmount: 0,
          unmatchedItems: 0,
        }),
    branchId ? getRecentInvoices(branchId, 5) : Promise.resolve([]),
  ]);

  return (
    <DashboardContent>
      <div className='animate-slide-in-left space-y-8 px-12 py-8'>
        {/* 1. 거래명세서 KPI - 최상단 */}
        <InvoiceKPICards stats={invoiceStats} />

        {/* 2. 재고 KPI 카드 */}
        <InventoryKPICards
          ingredients={ingredients}
          movements={movements}
          summary={movementsSummary}
        />

        {/* 3. 최근 명세서 & 저재고 알림 */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <RecentInvoices invoices={recentInvoices} />
          <ReorderAlerts ingredients={ingredients} />
        </div>

        {/* 4. 최근 입출고 */}
        <RecentMovements movements={recentMovements} />

        {/* 5. 매출 KPI 카드 */}
        <SalesKPICards salesSummary={salesSummary} ingredients={ingredients} />

        {/* 6. 차트 섹션 */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <SalesTrendChart trend7={trend7} trend30={trend30} />
          <TopMenusChart topMenus7={topMenus7} topMenus30={topMenus30} />
        </div>
      </div>
    </DashboardContent>
  );
}
