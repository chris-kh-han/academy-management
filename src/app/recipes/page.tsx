import {
  getAllRecipes,
  getAllIngredients,
  getMenuCategories,
  getAllMenus,
  getAllMenuOptions,
  getAllMenuCategories,
  getOptionsWithLinks,
} from '@/utils/supabase/supabase';
import { MenuBoard } from './_components/MenuBoard';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

const Recipes = async () => {
  const [
    recipes,
    allIngredients,
    existingCategories,
    allMenus,
    menuOptions,
    menuCategories,
    optionLinks,
  ] = await Promise.all([
    getAllRecipes(),
    getAllIngredients(),
    getMenuCategories(),
    getAllMenus(),
    getAllMenuOptions(),
    getAllMenuCategories(),
    getOptionsWithLinks(),
    minDelay(),
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
    <div className='px-12 py-8 animate-slide-in-left'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>메뉴 관리</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          메뉴 또는 카테고리를 추가하세요.
        </p>
      </div>

      <MenuBoard
        menus={
          allMenus?.map((menu) => ({
            menu_id: String(menu.menu_id),
            menu_name: menu.menu_name,
            category: menu.category || '기타',
            price: menu.price,
            image_url: menu.image_url,
            category_id: menu.category_id,
          })) ?? []
        }
        menuOptions={
          menuOptions?.map((option) => ({
            option_id: option.option_id,
            option_name: option.option_name,
            option_category: option.option_category,
            additional_price: option.additional_price,
            image_url: option.image_url,
            is_active: option.is_active,
          })) ?? []
        }
        categories={menuCategories ?? []}
        recipes={grouped}
        allIngredients={
          allIngredients?.map((ing) => ({
            ingredient_id: ing.ingredient_id,
            ingredient_name: ing.ingredient_name,
            category: ing.category,
            unit: ing.unit,
          })) ?? []
        }
        existingCategories={existingCategories}
        optionsByCategory={optionLinks.byCategory}
        optionsByMenu={optionLinks.byMenu}
      />
    </div>
  );
};

export default Recipes;
