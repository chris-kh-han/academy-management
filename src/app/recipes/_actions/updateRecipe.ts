'use server';

import { createClient } from '@/utils/supabase/server';
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
  const supabase = await createClient();

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
