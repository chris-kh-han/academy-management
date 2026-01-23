'use server';

import { revalidatePath } from 'next/cache';
import {
  generateOrderRecommendations,
  updateRecommendationItemQty,
  markRecommendationAsOrdered,
  getOrderRecommendations,
  getIngredientsForClosing,
} from '@/utils/supabase/supabase';
import type { CalculationMethod } from '@/types';

export async function getOrdersDataAction(branchId: string) {
  const [recommendations, ingredients] = await Promise.all([
    getOrderRecommendations(branchId, 10),
    getIngredientsForClosing(branchId),
  ]);

  return {
    success: true,
    data: {
      recommendations,
      ingredients,
    },
  };
}

export async function generateRecommendationsAction(
  branchId: string,
  method: CalculationMethod,
  options?: { orderPeriodDays?: number; avgDays?: number },
) {
  const result = await generateOrderRecommendations(branchId, method, options);

  if (result.success) {
    revalidatePath('/orders');
  }

  return result;
}

export async function updateItemQtyAction(itemId: string, orderedQty: number) {
  const result = await updateRecommendationItemQty(itemId, orderedQty);

  if (result.success) {
    revalidatePath('/orders');
  }

  return result;
}

export async function markAsOrderedAction(recommendationId: string) {
  const result = await markRecommendationAsOrdered(recommendationId);

  if (result.success) {
    revalidatePath('/orders');
  }

  return result;
}
