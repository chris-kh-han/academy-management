'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

type MenuInput = {
  menu_name: string;
  category?: string; // 레거시 지원 (선택)
  category_id?: string; // 새로운 카테고리 시스템 (선택)
  price: number;
  branch_id: string;
  image_url?: string | null;
};

type IngredientInput = {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: string;
  required_qty: number;
  unit: string;
  loss_rate: number;
};

export async function createMenu(
  menuInput: MenuInput,
  ingredients: IngredientInput[] = [],
) {
  const supabase = createServiceRoleClient();

  // menu_id 자동 생성 (M + 숫자)
  const { data: lastMenu } = await supabase
    .from('menus')
    .select('menu_id')
    .order('menu_id', { ascending: false })
    .limit(1)
    .single();

  let nextMenuId = 'M001';
  if (lastMenu?.menu_id) {
    const num = parseInt(lastMenu.menu_id.replace('M', ''), 10);
    nextMenuId = `M${String(num + 1).padStart(3, '0')}`;
  }

  // category_id가 있으면 카테고리 이름 조회
  let categoryName = menuInput.category;
  if (menuInput.category_id && !categoryName) {
    const { data: categoryData } = await supabase
      .from('menu_categories')
      .select('name')
      .eq('id', menuInput.category_id)
      .single();
    categoryName = categoryData?.name || null;
  }

  // 메뉴 생성
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .insert({
      menu_id: nextMenuId,
      menu_name: menuInput.menu_name,
      category: categoryName, // 카테고리 이름 (레거시 + 표시용)
      category_id: menuInput.category_id, // 카테고리 ID (관계)
      price: menuInput.price,
      branch_id: menuInput.branch_id,
      image_url: menuInput.image_url,
    })
    .select()
    .single();

  if (menuError) {
    console.error('Menu creation error:', menuError);
    return { success: false, error: menuError.message };
  }

  // 레시피 재료 추가 (있는 경우)
  if (ingredients.length > 0) {
    const recipeRows = ingredients.map((ing) => ({
      menu_id: nextMenuId,
      ingredient_id: ing.ingredient_id,
      ingredient_name: ing.ingredient_name,
      ingredient_category: ing.ingredient_category,
      required_qty: ing.required_qty,
      unit: ing.unit,
      loss_rate: ing.loss_rate,
      branch_id: menuInput.branch_id,
    }));

    const { error: recipeError } = await supabase
      .from('menu_recipes')
      .insert(recipeRows);

    if (recipeError) {
      console.error('Recipe creation error:', recipeError);
      // 메뉴는 생성됨, 레시피만 실패
      return {
        success: true,
        menu,
        warning: '메뉴는 생성되었지만 레시피 등록에 실패했습니다.'
      };
    }
  }

  revalidatePath('/recipes');
  return { success: true, menu };
}

export async function deleteMenu(menuId: string) {
  const supabase = createServiceRoleClient();

  // 레시피 먼저 삭제
  await supabase.from('menu_recipes').delete().eq('menu_id', menuId);

  // 메뉴 삭제
  const { error } = await supabase.from('menus').delete().eq('menu_id', menuId);

  if (error) {
    console.error('Menu deletion error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/recipes');
  return { success: true };
}
