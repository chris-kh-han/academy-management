'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Supplier } from '@/types';
import { z } from 'zod';

// ========== 입력 검증 스키마 ==========

const supplierSchema = z.object({
  name: z.string().min(1, '업체명을 입력하세요'),
  business_no: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email('올바른 이메일 형식을 입력하세요')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  default_terms: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// ========== 공급업체 CRUD 서버 액션 ==========

export async function createSupplier(
  branchId: string,
  input: SupplierInput,
): Promise<{ success: boolean; data?: Supplier; error?: string }> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.',
    };
  }

  const supabase = createServiceRoleClient();

  // 같은 지점 내 중복 업체명 체크
  const { data: existing } = await supabase
    .from('suppliers')
    .select('id')
    .eq('branch_id', branchId)
    .eq('name', parsed.data.name)
    .maybeSingle();

  if (existing) {
    return { success: false, error: '이미 같은 이름의 업체가 존재합니다.' };
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      branch_id: branchId,
      name: parsed.data.name,
      business_no: parsed.data.business_no || null,
      contact_name: parsed.data.contact_name || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      default_terms: parsed.data.default_terms || null,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('createSupplier error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/suppliers');
  return { success: true, data };
}

export async function updateSupplier(
  supplierId: string,
  input: SupplierInput,
): Promise<{ success: boolean; data?: Supplier; error?: string }> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.',
    };
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: parsed.data.name,
      business_no: parsed.data.business_no || null,
      contact_name: parsed.data.contact_name || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      default_terms: parsed.data.default_terms || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', supplierId)
    .select()
    .single();

  if (error) {
    console.error('updateSupplier error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/suppliers');
  return { success: true, data };
}

export async function deleteSupplier(
  supplierId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  // 관련 명세서가 있는지 확인
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', supplierId);

  if (count && count > 0) {
    return {
      success: false,
      error: `이 업체에 연결된 명세서 ${count}건이 있습니다. 삭제하려면 먼저 명세서를 처리하세요.`,
    };
  }

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId);

  if (error) {
    console.error('deleteSupplier error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/suppliers');
  return { success: true };
}

export async function toggleSupplierActive(
  supplierId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: !isActive })
    .eq('id', supplierId);

  if (error) {
    console.error('toggleSupplierActive error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/suppliers');
  return { success: true };
}
