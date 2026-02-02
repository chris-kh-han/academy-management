import { getAllIngredients, getStockMovements } from '@/utils/supabase/supabase';
import { ForecastContent } from './components/ForecastContent';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function ForecastPage() {
  const [ingredients, movements] = await Promise.all([
    getAllIngredients(),
    getStockMovements(),
    minDelay(),
  ]);

  return (
    <div className='px-12 py-8 animate-slide-in-left'>
      <ForecastContent
        ingredients={ingredients ?? []}
        movements={movements ?? []}
      />
    </div>
  );
}
