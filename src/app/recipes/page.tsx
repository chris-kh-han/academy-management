import { getAllRecipes, getAllIngredients } from '@/utils/supabase/supabase';
import { RecipesTable } from './_components/RecipesTable';

const Recipes = async () => {
  const [recipes, allIngredients] = await Promise.all([
    getAllRecipes(),
    getAllIngredients(),
  ]);

  const grouped = (recipes ?? []).reduce(
    (
      acc: Record<
        string,
        {
          menuName: string;
          ingredients: {
            ingredient_id: string;
            name: string | undefined;
            category: string | undefined;
            qty: number | null;
            unit: string | undefined;
            loss_rate: number | null;
          }[];
        }
      >,
      cur,
    ) => {
      const menuId = cur.menus?.menu_id ?? 'unknown';
      const menuName = cur.menus?.menu_name ?? 'Unknown';

      if (!acc[menuId]) {
        acc[menuId] = { menuName, ingredients: [] };
      }
      acc[menuId].ingredients.push({
        ingredient_id: cur.ingredient_id,
        name: cur.ingredient_name,
        category: cur.ingredient_category,
        qty: cur.required_qty,
        unit: cur.unit,
        loss_rate: cur.loss_rate,
      });
      return acc;
    },
    {},
  );

  return (
    <div className='p-4'>
      <RecipesTable
        recipes={grouped}
        allIngredients={
          allIngredients?.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            ingredient_name: ing.ingredient_name,
            category: ing.category,
          })) ?? []
        }
      />
    </div>
  );
};

export default Recipes;
