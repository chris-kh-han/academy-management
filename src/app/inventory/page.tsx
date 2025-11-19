import { getAllIngredients } from '@/utils/supabase/supabase';
import { DataTableDemo } from './components/IngredientsTable';

// This page uses request-scoped APIs (cookies) via the Supabase server client.
// Prevent Next.js from statically collecting this page at build-time.
export const dynamic = 'force-dynamic';

const Inventory = async () => {
  const ingredients = await getAllIngredients();

  console.log(ingredients);

  return (
    <div className='p-4'>
      <div>재고</div>
      <DataTableDemo />
    </div>
  );
};

export default Inventory;
