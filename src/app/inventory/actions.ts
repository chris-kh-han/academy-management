'use server';

import {
  createStockMovement,
  updateStockMovement,
  deleteStockMovement,
  createIngredient,
  updateIngredient,
  bulkCreateIngredients,
} from '@/utils/supabase/supabase';
import { revalidatePath } from 'next/cache';
import type { StockMovementInput } from '@/types';

export async function createMovementAction(input: StockMovementInput) {
  const result = await createStockMovement(input);
  return result;
}

export async function updateMovementAction(
  id: number,
  input: Partial<StockMovementInput>,
) {
  const result = await updateStockMovement(id, input);
  return result;
}

export async function deleteMovementAction(id: number) {
  const result = await deleteStockMovement(id);
  return result;
}

// 재료 추가 액션
export async function createIngredientAction(input: {
  ingredient_name: string;
  category?: string;
  specification?: string;
  unit?: string;
  price?: number;
  current_qty?: number;
  reorder_point?: number;
  safety_stock?: number;
  branch_id: string;
}) {
  const result = await createIngredient(input);

  if (result.success) {
    revalidatePath('/inventory');
  }

  return result;
}

// 재료 수정 액션
export async function updateIngredientAction(
  id: string,
  input: {
    ingredient_name?: string;
    category?: string;
    specification?: string | null;
    unit?: string;
    price?: number | null;
    reorder_point?: number | null;
    safety_stock?: number | null;
  },
) {
  const result = await updateIngredient(id, input);

  if (result.success) {
    revalidatePath('/inventory');
  }

  return result;
}

// 재료 일괄 업로드 액션
export async function uploadIngredientsAction(
  ingredients: {
    ingredient_name: string;
    category?: string;
    specification?: string;
    unit?: string;
    price?: number;
    current_qty?: number;
    reorder_point?: number;
    safety_stock?: number;
    branch_id: string;
  }[],
) {
  const result = await bulkCreateIngredients(ingredients);

  if (result.success && result.inserted > 0) {
    revalidatePath('/inventory');
  }

  return result;
}
