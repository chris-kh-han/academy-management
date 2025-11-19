import { getAllIngredients } from '@/utils/supabase/supabase';
import { DataTableDemo } from './components/IngredientsTable';

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
