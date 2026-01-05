'use server';

import {
  createStockMovement,
  updateStockMovement,
  deleteStockMovement,
} from '@/utils/supabase/supabase';
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
