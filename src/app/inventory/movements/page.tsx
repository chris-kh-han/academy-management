import {
  getAllIngredients,
  getStockMovements,
  getStockMovementsSummary,
} from '@/utils/supabase/supabase';
import { MovementsContent } from './components/MovementsContent';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function MovementsPage() {
  const [ingredients, movements, summary] = await Promise.all([
    getAllIngredients(),
    getStockMovements(),
    getStockMovementsSummary(),
    minDelay(),
  ]);

  const ingredientOptions = (ingredients ?? []).map((item) => ({
    id: String(item.id),
    name: item.ingredient_name ?? '',
    unit: item.unit ?? '',
    current_qty: item.current_qty ?? 0,
  }));

  return (
    <div className='px-12 py-8 animate-slide-in-left'>
      <MovementsContent
        ingredients={ingredientOptions}
        movements={movements ?? []}
        summary={summary}
      />
    </div>
  );
}
