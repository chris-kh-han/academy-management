'use server';

import { revalidatePath } from 'next/cache';
import {
  createDailyClosing,
  saveClosingItem,
  bulkSaveClosingItems,
  completeClosing,
  getDailyClosing,
  getIngredientsForClosing,
  getDailyClosingHistory,
  getToday,
} from '@/utils/supabase/supabase';
import type { DailyClosingItemInput, DailyClosing } from '@/types';

export async function getClosingDataAction(branchId: string) {
  const today = getToday();

  const [todayClosing, ingredients, closingHistory] = await Promise.all([
    getDailyClosing(branchId, today),
    getIngredientsForClosing(branchId),
    getDailyClosingHistory(branchId),
  ]);

  return {
    success: true,
    data: {
      today,
      todayClosing,
      ingredients,
      closingHistory,
    },
  };
}

export async function createClosingAction(branchId: string, date: string) {
  const result = await createDailyClosing({
    branch_id: branchId,
    closing_date: date,
  });

  if (result.success) {
    revalidatePath('/closing');
  }

  return result;
}

export async function saveClosingItemAction(
  closingId: string,
  item: DailyClosingItemInput,
) {
  const result = await saveClosingItem(closingId, item);

  if (result.success) {
    revalidatePath('/closing');
  }

  return result;
}

export async function completeClosingAction(closingId: string, userId: string) {
  const result = await completeClosing(closingId, userId);

  if (result.success) {
    revalidatePath('/closing');
    revalidatePath('/inventory');
  }

  return result;
}

export async function bulkSaveClosingItemsAction(
  closingId: string,
  items: DailyClosingItemInput[],
) {
  const result = await bulkSaveClosingItems(closingId, items);

  if (result.success) {
    revalidatePath('/closing');
  }

  return result;
}
