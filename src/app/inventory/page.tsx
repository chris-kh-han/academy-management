import { getAllIngredients } from '@/utils/supabase/supabase';
import { IngredientsTable, Ingredient } from './components/IngredientsTable';

// This page uses request-scoped APIs (cookies) via the Supabase server client.
// Prevent Next.js from statically collecting this page at build-time.
export const dynamic = 'force-dynamic';

const Inventory = async () => {
  const ingredients = await getAllIngredients();

  // DB 데이터를 테이블 컴포넌트에 맞게 변환
  const tableData: Ingredient[] = (ingredients ?? []).map((item) => ({
    id: item.id,
    ingredient_id: item.ingredient_id ?? '',
    ingredient_name: item.ingredient_name ?? '',
    category: item.category ?? '',
    unit: item.unit ?? '',
    price: item.price ?? 0,
    current_qty: item.current_qty ?? 0,
    reorder_point: item.reorder_point ?? null,
    safety_stock: item.safety_stock ?? null,
  }));
  console.log(ingredients);
  console.log(tableData);

  return (
    <div className='p-4 md:p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>재고 관리</h1>
        <p className='text-muted-foreground'>
          재료 재고 현황을 확인하고 관리합니다.
        </p>
      </div>
      <IngredientsTable data={tableData} />
    </div>
  );
};

export default Inventory;
