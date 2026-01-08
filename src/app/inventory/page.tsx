import {
  getAllIngredients,
  getStockMovements,
  getStockMovementsSummary,
} from '@/utils/supabase/supabase';
import { InventoryContent } from './components/InventoryContent';
import { Ingredient } from './components/IngredientsTable';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

const Inventory = async () => {
  const [ingredients, movements, summary] = await Promise.all([
    getAllIngredients(),
    getStockMovements(),
    getStockMovementsSummary(),
    minDelay(),
  ]);

  const tableData: Ingredient[] = (ingredients ?? []).map((item) => ({
    id: String(item.id),
    ingredient_id: item.ingredient_id ?? '',
    ingredient_name: item.ingredient_name ?? '',
    category: item.category ?? '',
    unit: item.unit ?? '',
    price: item.price ?? 0,
    current_qty: item.current_qty ?? 0,
    reorder_point: item.reorder_point ?? null,
    safety_stock: item.safety_stock ?? null,
  }));

  return (
    <div className='p-4 md:p-6'>
      <InventoryContent
        ingredients={tableData}
        movements={movements ?? []}
        summary={summary}
      />
    </div>
  );
};

export default Inventory;
