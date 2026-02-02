import {
  getPurchaseOrders,
  getAllIngredients,
  getReorderRecommendations,
} from '@/utils/supabase/supabase';
import { OrdersContent } from './components/OrdersContent';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [orders, ingredients, recommendations] = await Promise.all([
    getPurchaseOrders(),
    getAllIngredients(),
    getReorderRecommendations(),
    minDelay(),
  ]);

  const ingredientOptions = (ingredients ?? []).map((item) => ({
    id: String(item.id),
    name: item.ingredient_name ?? '',
    unit: item.unit ?? '',
    price: item.price ?? 0,
    current_qty: item.current_qty ?? 0,
    reorder_point: item.reorder_point ?? null,
  }));

  return (
    <div className='px-12 py-8 animate-slide-in-left'>
      <OrdersContent
        orders={orders}
        ingredients={ingredientOptions}
        recommendations={recommendations}
      />
    </div>
  );
}
