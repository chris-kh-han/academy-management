'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { DailyClosingInput } from '@/types';

// 보관위치 목록 조회
export async function getStorageLocationsAction(branchId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getStorageLocationsAction error:', error);
    return [];
  }

  return data || [];
}

// 마감용 재료 목록 조회 (우선순위, 보관위치 포함)
export async function getIngredientsForClosingAction(branchId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('branch_id', branchId)
    .order('priority', { ascending: true })
    .order('storage_location', { ascending: true })
    .order('ingredient_name', { ascending: true });

  if (error) {
    console.error('getIngredientsForClosingAction error:', error);
    return [];
  }

  return data || [];
}

// 오늘 마감 데이터 조회
export async function getTodayClosingAction(branchId: string, date: string) {
  const supabase = createServiceRoleClient();

  // 마감 헤더 조회
  const { data: closing, error: closingError } = await supabase
    .from('daily_closings')
    .select('*')
    .eq('branch_id', branchId)
    .eq('closing_date', date)
    .maybeSingle();

  if (closingError) {
    console.error('getTodayClosingAction closing error:', closingError);
    return null;
  }

  if (!closing) {
    return null;
  }

  // 마감 아이템 조회
  const { data: items, error: itemsError } = await supabase
    .from('daily_closing_items')
    .select('*, ingredients(*)')
    .eq('closing_id', closing.id);

  if (itemsError) {
    console.error('getTodayClosingAction items error:', itemsError);
  }

  return {
    ...closing,
    items: items || [],
  };
}

// 마감 생성 또는 업데이트
export async function saveClosingAction(input: DailyClosingInput) {
  const supabase = createServiceRoleClient();

  // 기존 마감 조회
  const { data: existingClosing } = await supabase
    .from('daily_closings')
    .select('id')
    .eq('branch_id', input.branch_id)
    .eq('closing_date', input.closing_date)
    .maybeSingle();

  let closingId: string;

  if (existingClosing) {
    // 기존 마감 업데이트
    closingId = existingClosing.id;
    await supabase
      .from('daily_closings')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', closingId);

    // 기존 아이템 삭제
    await supabase
      .from('daily_closing_items')
      .delete()
      .eq('closing_id', closingId);
  } else {
    // 새 마감 생성
    const { data: newClosing, error: createError } = await supabase
      .from('daily_closings')
      .insert({
        branch_id: input.branch_id,
        closing_date: input.closing_date,
        status: 'draft',
      })
      .select()
      .single();

    if (createError || !newClosing) {
      console.error('saveClosingAction create error:', createError);
      return { success: false, error: createError?.message };
    }

    closingId = newClosing.id;
  }

  // 재료 정보 조회 (포장 단위 계산용)
  const ingredientIds = input.items.map((i) => i.ingredient_id);
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, current_qty, packs_per_box, units_per_pack')
    .in('id', ingredientIds);

  const ingredientMap = new Map(
    (ingredients || []).map((i) => [i.id, i]),
  );

  // 마감 아이템 삽입
  const itemsToInsert = input.items.map((item) => {
    const ingredient = ingredientMap.get(item.ingredient_id);
    const packsPerBox = ingredient?.packs_per_box || 1;
    const unitsPerPack = ingredient?.units_per_pack || 1;

    // 총 수량 계산: 박스*팩수*낱개수 + 팩*낱개수 + 낱개
    const closingQty =
      (item.closing_boxes ?? 0) * packsPerBox * unitsPerPack +
      (item.closing_packs ?? 0) * unitsPerPack +
      (item.closing_units ?? 0);

    return {
      closing_id: closingId,
      ingredient_id: item.ingredient_id,
      opening_qty: ingredient?.current_qty || 0,
      used_qty: 0,
      waste_qty: 0,
      closing_qty: closingQty,
      closing_boxes: item.closing_boxes,
      closing_packs: item.closing_packs,
      closing_units: item.closing_units,
      note: item.note,
    };
  });

  const { error: insertError } = await supabase
    .from('daily_closing_items')
    .insert(itemsToInsert);

  if (insertError) {
    console.error('saveClosingAction insert error:', insertError);
    return { success: false, error: insertError.message };
  }

  revalidatePath('/inventory/closing');
  return { success: true, closingId };
}

// 마감 완료 처리
export async function completeClosingAction(
  closingId: string,
  closedBy?: string,
) {
  const supabase = createServiceRoleClient();

  // 마감 상태 업데이트
  const { error: updateError } = await supabase
    .from('daily_closings')
    .update({
      status: 'completed',
      closed_by: closedBy,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', closingId);

  if (updateError) {
    console.error('completeClosingAction update error:', updateError);
    return { success: false, error: updateError.message };
  }

  // 마감 아이템 조회
  const { data: items } = await supabase
    .from('daily_closing_items')
    .select('ingredient_id, closing_qty')
    .eq('closing_id', closingId);

  // 각 재료의 현재 재고를 마감 수량으로 업데이트
  for (const item of items || []) {
    await supabase
      .from('ingredients')
      .update({
        current_qty: item.closing_qty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.ingredient_id);
  }

  revalidatePath('/inventory/closing');
  revalidatePath('/inventory');
  return { success: true };
}

// 보관위치 추가
export async function addStorageLocationAction(input: {
  name: string;
  description?: string;
  branch_id: string;
}) {
  const supabase = createServiceRoleClient();

  // 중복 체크
  const { data: existing } = await supabase
    .from('storage_locations')
    .select('id')
    .eq('branch_id', input.branch_id)
    .eq('name', input.name)
    .maybeSingle();

  if (existing) {
    return { success: false, error: '이미 같은 이름의 보관위치가 존재합니다.' };
  }

  // 다음 sort_order 조회
  const { data: maxSort } = await supabase
    .from('storage_locations')
    .select('sort_order')
    .eq('branch_id', input.branch_id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = (maxSort?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('storage_locations')
    .insert({
      name: input.name,
      description: input.description,
      branch_id: input.branch_id,
      sort_order: nextSortOrder,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('addStorageLocationAction error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
