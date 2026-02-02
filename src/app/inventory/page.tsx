import {
  getAllIngredients,
  getStockMovementsSummary,
  getRecentStockMovements,
  getTodayMovementsCount,
} from '@/utils/supabase/supabase';
import { InventoryDashboard } from './components/InventoryDashboard';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  // async-parallel: 독립적인 쿼리들을 병렬 실행
  // server-dedup-props: 필요한 데이터만 조회 (getStockMovements 제거, getTodayMovementsCount 추가)
  const [ingredients, summary, recentMovements, todayMovementsCount] =
    await Promise.all([
      getAllIngredients(),
      getStockMovementsSummary(),
      getRecentStockMovements(5), // 5개만 표시하므로 5개만 조회
      getTodayMovementsCount(), // COUNT 쿼리로 최적화
      minDelay(),
    ]);

  // 재고 KPI 계산
  const totalValue = (ingredients ?? []).reduce(
    (sum, item) => sum + (item.current_qty ?? 0) * (item.price ?? 0),
    0,
  );

  const lowStockItems = (ingredients ?? []).filter((item) => {
    const reorderPoint = item.reorder_point ?? 0;
    return (item.current_qty ?? 0) < reorderPoint && (item.current_qty ?? 0) > 0;
  });

  const outOfStockItems = (ingredients ?? []).filter(
    (item) => (item.current_qty ?? 0) <= 0,
  );

  // ingredientOptions for InvoiceScanDialog
  const ingredientOptions = (ingredients ?? []).map((item) => ({
    id: String(item.id),
    name: item.ingredient_name ?? '',
    unit: item.unit ?? '',
    current_qty: item.current_qty ?? 0,
  }));

  return (
    <div className='px-4 py-6 sm:px-8 sm:py-8 md:px-12 animate-slide-in-left'>
      <InventoryDashboard
        totalValue={totalValue}
        lowStockCount={lowStockItems.length}
        outOfStockCount={outOfStockItems.length}
        todayMovementsCount={todayMovementsCount}
        summary={summary}
        lowStockItems={lowStockItems.slice(0, 5).map((item) => ({
          id: String(item.id),
          name: item.ingredient_name ?? '',
          currentQty: item.current_qty ?? 0,
          reorderPoint: item.reorder_point ?? 0,
          unit: item.unit ?? '',
        }))}
        recentMovements={recentMovements}
        ingredientOptions={ingredientOptions}
      />
    </div>
  );
}
