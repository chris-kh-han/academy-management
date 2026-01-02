'use server';

import {
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
} from '@/utils/supabase/supabase';
import { revalidatePath } from 'next/cache';
import type { MenuCategoryInput } from '@/types';

export async function createCategory(input: MenuCategoryInput) {
  const result = await createMenuCategory(input);

  if (result.success) {
    revalidatePath('/recipes');
  }

  return result;
}

export async function updateCategory(id: string, input: Partial<MenuCategoryInput>) {
  const result = await updateMenuCategory(id, input);

  if (result.success) {
    revalidatePath('/recipes');
  }

  return result;
}

export async function deleteCategory(id: string) {
  const result = await deleteMenuCategory(id);

  if (result.success) {
    revalidatePath('/recipes');
  }

  return result;
}

/**
 * 카테고리 순서 업데이트
 * @param categoryIds 새로운 순서대로 정렬된 카테고리 ID 배열
 */
export async function updateCategoryOrder(
  categoryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { createServiceRoleClient } = await import('@/utils/supabase/server');
    const supabase = createServiceRoleClient();

    // 각 카테고리의 sort_order를 개별 업데이트
    const updatePromises = categoryIds.map((id, index) =>
      supabase
        .from('menu_categories')
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error('updateCategoryOrder errors:', errors);
      return { success: false, error: errors[0].error?.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('updateCategoryOrder error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
