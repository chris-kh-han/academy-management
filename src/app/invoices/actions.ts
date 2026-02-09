'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { learnTemplateFromConfirmedInvoice } from '@/lib/ocr/gemini-vision';
import type {
  Invoice,
  InvoiceStatus,
  InvoiceItemMatchStatus,
  Supplier,
  ConfirmInvoiceResult,
} from '@/types';
import { z } from 'zod';

// ========== 입력 검증 스키마 ==========

const invoiceItemSchema = z.object({
  item_name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
  box_qty: z.number().min(0).optional(),
  ea_qty: z.number().min(0).optional(),
});

const createInvoiceSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  supplierName: z.string().optional(),
  invoiceNo: z.string().optional(),
  invoiceDate: z.string().optional(),
  imageUrl: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, '최소 1개 품목이 필요합니다.'),
});

const confirmItemSchema = z.object({
  invoice_item_id: z.string().uuid(),
  confirmed_qty: z.number().min(0),
  matched_ingredient_id: z.string().uuid().nullable().optional(),
});

// ========== 거래명세서 조회 액션 ==========

/**
 * 지점의 거래명세서 목록 조회 (필터 지원)
 */
export async function getInvoices(
  branchId: string,
  filters?: {
    status?: InvoiceStatus;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<Invoice[]> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from('invoices')
    .select('*, supplier:suppliers(*)')
    .eq('branch_id', branchId)
    .order('received_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.supplierId) {
    query = query.eq('supplier_id', filters.supplierId);
  }
  if (filters?.dateFrom) {
    query = query.gte('invoice_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('invoice_date', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getInvoices action error:', error);
    return [];
  }
  return (data as Invoice[]) ?? [];
}

/**
 * 거래명세서 단건 조회 (품목 + 공급업체 포함)
 */
export async function getInvoiceById(
  invoiceId: string,
): Promise<Invoice | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(
      '*, supplier:suppliers(*), items:invoice_items(*, ingredient:ingredients(id, ingredient_name, unit, category))',
    )
    .eq('id', invoiceId)
    .maybeSingle();

  if (error) {
    console.error('getInvoiceById action error:', error);
    return null;
  }
  return data as Invoice | null;
}

// ========== 거래명세서 생성/수정/삭제 액션 ==========

/**
 * OCR 결과로부터 거래명세서 생성
 */
export async function createInvoiceFromOCR(data: {
  branchId: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  imageUrl?: string;
  items: Array<{
    item_name: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    total_price: number;
    box_qty?: number;
    ea_qty?: number;
  }>;
}): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const parsed = createInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.',
    };
  }

  const supabase = createServiceRoleClient();
  const input = parsed.data;

  // 공급업체 자동 매칭 (이름으로 찾기)
  let supplierId = input.supplierId ?? null;
  if (!supplierId && input.supplierName) {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('branch_id', input.branchId)
      .eq('is_active', true)
      .ilike('name', input.supplierName)
      .limit(1)
      .maybeSingle();

    if (supplier) {
      supplierId = supplier.id;
    }
  }

  // 총 금액 계산
  const totalAmount = input.items.reduce(
    (sum, item) => sum + item.total_price,
    0,
  );

  // 1. 명세서 헤더 생성
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      branch_id: input.branchId,
      supplier_id: supplierId,
      invoice_no: input.invoiceNo || null,
      invoice_date: input.invoiceDate || null,
      image_url: input.imageUrl || null,
      total_amount: totalAmount,
      confirmed_amount: 0,
      status: 'received' as InvoiceStatus,
      delivery_status: 'pending',
    })
    .select('id')
    .single();

  if (invoiceError || !invoice) {
    console.error('createInvoiceFromOCR invoice error:', invoiceError);
    return {
      success: false,
      error: invoiceError?.message ?? '명세서 생성 실패',
    };
  }

  // 2. 품목 일괄 삽입
  const itemsData = input.items.map((item) => ({
    invoice_id: invoice.id,
    item_name: item.item_name,
    quantity: item.quantity,
    unit: item.unit || null,
    unit_price: item.unit_price,
    total_price: item.total_price,
    box_qty: item.box_qty ?? 0,
    ea_qty: item.ea_qty ?? 0,
    match_status: 'unmatched' as InvoiceItemMatchStatus,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsData);

  if (itemsError) {
    console.error('createInvoiceFromOCR items error:', itemsError);
    // 롤백: 명세서 삭제
    await supabase.from('invoices').delete().eq('id', invoice.id);
    return { success: false, error: itemsError.message };
  }

  revalidatePath('/invoices');
  return { success: true, invoiceId: invoice.id };
}

/**
 * 거래명세서 상태 변경
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  confirmedBy?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = { status };

  if (status === 'confirmed' && confirmedBy) {
    updateData.confirmed_by = confirmedBy;
    updateData.confirmed_at = new Date().toISOString();
    updateData.delivery_status = 'delivered';
  }

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId);

  if (error) {
    console.error('updateInvoiceStatus error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}

/**
 * 거래명세서 확정 (RPC 함수 호출 - 재고 반영 포함)
 */
export async function confirmInvoice(
  invoiceId: string,
  confirmedBy: string,
  items: Array<{
    invoice_item_id: string;
    confirmed_qty: number;
    matched_ingredient_id?: string | null;
  }>,
  branchId?: string,
): Promise<ConfirmInvoiceResult> {
  const parsedItems = z.array(confirmItemSchema).safeParse(items);
  if (!parsedItems.success) {
    return {
      success: false,
      error:
        parsedItems.error.issues[0]?.message ??
        '확정 항목 데이터가 올바르지 않습니다.',
    };
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('confirm_invoice', {
    p_invoice_id: invoiceId,
    p_confirmed_by: confirmedBy,
    p_items: JSON.stringify(parsedItems.data),
  });

  if (error) {
    console.error('confirmInvoice RPC error:', error);
    return { success: false, error: error.message };
  }

  // RPC 함수는 JSONB 반환
  const result = (
    typeof data === 'string' ? JSON.parse(data) : data
  ) as ConfirmInvoiceResult;

  if (result.success) {
    revalidatePath('/invoices');
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath('/inventory');

    // 템플릿 학습: 확정 시 매칭 정보를 저장하여 다음 OCR에 활용
    if (branchId) {
      learnTemplateFromConfirmedInvoice(invoiceId, branchId).catch((err) =>
        console.error('Template learning error (non-blocking):', err),
      );
    }
  }

  return result;
}

/**
 * 거래명세서 품목 매칭 업데이트
 */
export async function updateInvoiceItemMatch(
  itemId: string,
  matchedIngredientId: string | null,
  matchStatus?: InvoiceItemMatchStatus,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('invoice_items')
    .update({
      matched_ingredient_id: matchedIngredientId,
      match_status:
        matchStatus ?? (matchedIngredientId ? 'manual_matched' : 'unmatched'),
    })
    .eq('id', itemId);

  if (error) {
    console.error('updateInvoiceItemMatch error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 거래명세서 삭제
 */
export async function deleteInvoice(
  invoiceId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  // 확정된 명세서는 삭제 불가
  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .maybeSingle();

  if (!invoice) {
    return { success: false, error: '명세서를 찾을 수 없습니다.' };
  }

  if (invoice.status === 'confirmed') {
    return {
      success: false,
      error: '확정된 명세서는 삭제할 수 없습니다.',
    };
  }

  // CASCADE 설정으로 invoice_items도 자동 삭제
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) {
    console.error('deleteInvoice error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/invoices');
  return { success: true };
}

/**
 * 거래명세서 메모 업데이트
 */
export async function updateInvoiceNotes(
  invoiceId: string,
  notes: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('invoices')
    .update({ notes })
    .eq('id', invoiceId);

  if (error) {
    console.error('updateInvoiceNotes error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  return { success: true };
}

// ========== 헬퍼 조회 액션 ==========

/**
 * 지점의 활성 공급업체 목록 조회 (셀렉트박스용)
 */
export async function getSuppliersByBranch(
  branchId: string,
): Promise<Supplier[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('getSuppliersByBranch error:', error);
    return [];
  }
  return data ?? [];
}

/**
 * 지점의 재료 목록 조회 (매칭용)
 */
export async function getIngredientsList(branchId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, ingredient_name, unit, category')
    .eq('branch_id', branchId)
    .order('ingredient_name');

  if (error) {
    console.error('getIngredientsList error:', error);
    return [];
  }
  return data ?? [];
}
