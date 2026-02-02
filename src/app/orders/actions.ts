'use server';

import { revalidatePath } from 'next/cache';
import {
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  receivePurchaseOrder,
} from '@/utils/supabase/supabase';
import type { PurchaseOrderInput, PurchaseOrderStatus } from '@/types';

export async function createOrderAction(input: PurchaseOrderInput) {
  const result = await createPurchaseOrder(input);

  if (result.success) {
    revalidatePath('/orders');
    revalidatePath('/inventory');
  }

  return result;
}

export async function updateOrderStatusAction(
  orderId: number,
  status: PurchaseOrderStatus,
) {
  const result = await updatePurchaseOrderStatus(orderId, status);

  if (result.success) {
    revalidatePath('/orders');
  }

  return result;
}

export async function deleteOrderAction(orderId: number) {
  const result = await deletePurchaseOrder(orderId);

  if (result.success) {
    revalidatePath('/orders');
  }

  return result;
}

export async function receiveOrderAction(orderId: number) {
  const result = await receivePurchaseOrder(orderId);

  if (result.success) {
    revalidatePath('/orders');
    revalidatePath('/inventory');
    revalidatePath('/inventory/movements');
  }

  return result;
}
