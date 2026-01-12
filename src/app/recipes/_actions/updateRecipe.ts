'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

type IngredientInput = {
  ingredient_id: string;
  ingredient_name: string;
  ingredient_category: string;
  required_qty: number;
  unit: string;
  loss_rate: number;
};

export async function updateRecipeIngredients(
  menuId: string,
  ingredients: IngredientInput[],
) {
  const supabase = createServiceRoleClient();

  // 기존 재료 삭제
  const { error: deleteError } = await supabase
    .from('menu_recipes')
    .delete()
    .eq('menu_id', menuId);

  if (deleteError) {
    console.error('Delete error:', deleteError);
    return { success: false, error: deleteError.message };
  }

  // 새 재료 삽입
  if (ingredients.length > 0) {
    const rows = ingredients.map((ing) => ({
      menu_id: menuId,
      ingredient_id: ing.ingredient_id,
      ingredient_name: ing.ingredient_name,
      ingredient_category: ing.ingredient_category,
      required_qty: ing.required_qty,
      unit: ing.unit,
      loss_rate: ing.loss_rate,
    }));

    const { error: insertError } = await supabase
      .from('menu_recipes')
      .insert(rows);

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: insertError.message };
    }
  }

  revalidatePath('/recipes');
  return { success: true };
}

export async function updateMenuMetadata(
  menuId: string,
  data: { image_url?: string; category_id?: string | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    // category_id가 변경된 경우 카테고리 이름도 조회
    let categoryName: string | null = null;
    if (data.category_id) {
      const { data: categoryData } = await supabase
        .from('menu_categories')
        .select('name')
        .eq('id', data.category_id)
        .single();
      categoryName = categoryData?.name || null;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.image_url !== undefined) {
      updateData.image_url = data.image_url || null;
    }

    if (data.category_id !== undefined) {
      updateData.category_id = data.category_id || null;
      updateData.category = categoryName;
    }

    const { error } = await supabase
      .from('menus')
      .update(updateData)
      .eq('menu_id', menuId);

    if (error) {
      console.error('updateMenuMetadata error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('updateMenuMetadata catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
