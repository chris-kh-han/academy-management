'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/utils/supabase/server';
import { getSalesHistory } from '@/utils/supabase/supabase';
import type { SalesUploadRow, CSVMapping, MenuSale } from '@/types';

type UploadResult = {
  success: boolean;
  inserted: number;
  updated: number;
  menusCreated: number;
  errors: string[];
};

/**
 * CSV 매핑 설정 가져오기
 */
export async function getCSVMapping(branchId: string): Promise<CSVMapping | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('csv_mappings')
    .select('*')
    .eq('branch_id', branchId)
    .eq('mapping_name', 'default')
    .single();

  if (error || !data) return null;
  return data as CSVMapping;
}

/**
 * CSV 매핑 설정 저장
 */
export async function saveCSVMapping(
  branchId: string,
  mapping: {
    date_column?: string;
    menu_name_column?: string;
    quantity_column?: string;
    price_column?: string;
    total_column?: string;
    transaction_id_column?: string;
  }
): Promise<{ success: boolean }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('csv_mappings')
    .upsert(
      {
        branch_id: branchId,
        mapping_name: 'default',
        ...mapping,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'branch_id,mapping_name',
      }
    );

  if (error) {
    console.error('Save mapping error:', error);
    return { success: false };
  }

  return { success: true };
}

/**
 * 메뉴명으로 메뉴 조회 또는 생성
 * 새 메뉴는 자동으로 생성됨
 */
async function getOrCreateMenu(
  supabase: ReturnType<typeof createServiceRoleClient>,
  menuName: string,
  branchId: string,
  price?: number
): Promise<{ menu_id: string; isNew: boolean } | null> {
  // 1. 기존 메뉴 조회 (이름으로)
  const { data: existingMenu } = await supabase
    .from('menus')
    .select('menu_id, price')
    .eq('branch_id', branchId)
    .eq('menu_name', menuName)
    .single();

  if (existingMenu) {
    return { menu_id: existingMenu.menu_id, isNew: false };
  }

  // 2. 새 메뉴 생성
  // menu_id 자동 생성 (M + 숫자)
  const { data: lastMenu } = await supabase
    .from('menus')
    .select('menu_id')
    .order('menu_id', { ascending: false })
    .limit(1)
    .single();

  let nextMenuId = 'M001';
  if (lastMenu?.menu_id) {
    const num = parseInt(lastMenu.menu_id.replace('M', ''), 10);
    nextMenuId = `M${String(num + 1).padStart(3, '0')}`;
  }

  const { data: newMenu, error } = await supabase
    .from('menus')
    .insert({
      menu_id: nextMenuId,
      menu_name: menuName,
      price: price || 0,
      branch_id: branchId,
    })
    .select('menu_id')
    .single();

  if (error) {
    console.error('Create menu error:', error);
    return null;
  }

  return { menu_id: newMenu.menu_id, isNew: true };
}


/**
 * DB 타임스탬프를 CSV 형식으로 정규화
 */
function normalizeTimestamp(dbTimestamp: string): string {
  let normalized = dbTimestamp || '';
  normalized = normalized.replace(/[TZ]/g, ' ').trim();  // T,Z → 공백
  normalized = normalized.replace(/\+\d{2}:\d{2}$/, ''); // +00:00 제거
  normalized = normalized.replace(/\.\d{3}/, '');        // 밀리초 제거
  return normalized.trim();
}

/**
 * 중복 데이터 체크 (업로드 전 확인용)
 */
export async function checkDuplicates(
  rows: SalesUploadRow[],
  branchId: string
): Promise<{ total: number; duplicates: number; newRecords: number }> {
  const supabase = createServiceRoleClient();

  // 유효한 행만 필터링
  const validRows = rows.filter(r => r.menu_name && r.sold_at && r.isValid);
  const total = validRows.length;

  if (total === 0) {
    return { total: 0, duplicates: 0, newRecords: 0 };
  }

  // 날짜 범위로 기존 레코드 조회
  const dates = [...new Set(validRows.map(r => r.sold_at?.split(' ')[0]).filter(Boolean))];

  if (dates.length === 0) {
    return { total, duplicates: 0, newRecords: total };
  }

  const minDate = dates.sort()[0];
  const maxDate = dates.sort().reverse()[0];

  const { data: existingRecords } = await supabase
    .from('menu_sales')
    .select('sold_at, menu_id')
    .eq('branch_id', branchId)
    .gte('sold_at', `${minDate} 00:00:00`)
    .lte('sold_at', `${maxDate} 23:59:59`);

  // 기존 레코드 키 셋 생성
  const existingKeys = new Set(
    existingRecords?.map(e => `${normalizeTimestamp(e.sold_at)}_${e.menu_id}`) || []
  );

  // 메뉴명 → menu_id 매핑 조회
  const menuNames = [...new Set(validRows.map(r => r.menu_name.trim()))];
  const { data: menus } = await supabase
    .from('menus')
    .select('menu_id, menu_name')
    .eq('branch_id', branchId)
    .in('menu_name', menuNames);

  const menuNameToId = new Map(menus?.map(m => [m.menu_name, m.menu_id]) || []);

  // 중복 체크
  let duplicates = 0;
  for (const row of validRows) {
    const menuId = menuNameToId.get(row.menu_name.trim());
    if (menuId) {
      const key = `${row.sold_at}_${menuId}`;
      if (existingKeys.has(key)) {
        duplicates++;
      }
    }
  }

  return {
    total,
    duplicates,
    newRecords: total - duplicates,
  };
}

/**
 * 판매 데이터 업로드 (메뉴명 기반, datetime으로 중복 관리)
 */
export async function uploadSales(
  rows: SalesUploadRow[],
  branchId: string,
): Promise<UploadResult> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];
  let insertedCount = 0;
  let updatedCount = 0;
  let menusCreatedCount = 0;

  try {
    // 기존 데이터 조회 (중복 체크용)
    // 날짜 범위로 쿼리 후 JavaScript에서 필터링
    const dates = [...new Set(rows.map(r => r.sold_at?.split(' ')[0]).filter(Boolean))];
    let existingKeys = new Set<string>();

    if (dates.length > 0) {
      const minDate = dates.sort()[0];
      const maxDate = dates.sort().reverse()[0];

      const { data: existingRecords } = await supabase
        .from('menu_sales')
        .select('sold_at, menu_id')
        .eq('branch_id', branchId)
        .gte('sold_at', `${minDate} 00:00:00`)
        .lte('sold_at', `${maxDate} 23:59:59`);

      // 기존 레코드 키 셋 생성 (sold_at_menu_id)
      // DB에서 타임존 정보 제거하여 비교 (예: "2025-01-02T14:30:25+00:00" → "2025-01-02 14:30:25")
      existingKeys = new Set(
        existingRecords?.map(e => {
          // ISO 포맷 → CSV 포맷으로 정규화
          let normalizedSoldAt = e.sold_at || '';
          normalizedSoldAt = normalizedSoldAt.replace(/[TZ]/g, ' ').trim();  // T,Z → 공백
          normalizedSoldAt = normalizedSoldAt.replace(/\+\d{2}:\d{2}$/, ''); // +00:00 제거
          normalizedSoldAt = normalizedSoldAt.replace(/\.\d{3}/, '');        // 밀리초 제거
          normalizedSoldAt = normalizedSoldAt.trim();
          return `${normalizedSoldAt}_${e.menu_id}`;
        }) || []
      );
    }

    // 각 행 처리
    for (const row of rows) {
      if (!row.menu_name || !row.sold_at) {
        errors.push(`빈 데이터: ${JSON.stringify(row)}`);
        continue;
      }

      // 메뉴 조회 또는 생성
      const menuResult = await getOrCreateMenu(
        supabase,
        row.menu_name.trim(),
        branchId,
        row.price
      );

      if (!menuResult) {
        errors.push(`메뉴 생성 실패: ${row.menu_name}`);
        continue;
      }

      if (menuResult.isNew) {
        menusCreatedCount++;
      }

      // 가격 계산 (없으면 메뉴 기본가격 사용)
      let price = row.price;
      let totalSales = row.total_sales;

      if (!price) {
        // 기존 메뉴 가격 조회
        const { data: menu } = await supabase
          .from('menus')
          .select('price')
          .eq('menu_id', menuResult.menu_id)
          .single();
        price = menu?.price || 0;
      }

      if (!totalSales && price && row.sales_count) {
        totalSales = price * row.sales_count;
      }

      // 저장할 데이터
      const salesData = {
        menu_id: menuResult.menu_id,
        branch_id: branchId,
        sold_at: row.sold_at,
        sales_count: row.sales_count,
        price: price || 0,
        total_sales: totalSales || 0,
        transaction_id: row.transaction_id || null,
        updated_at: new Date().toISOString(),
      };

      // 중복 여부 체크
      const recordKey = `${row.sold_at}_${menuResult.menu_id}`;
      const isUpdate = existingKeys.has(recordKey);

      // datetime + menu + branch 기준 upsert (같은 시간의 동일 메뉴는 덮어쓰기)
      const { error: upsertError } = await supabase
        .from('menu_sales')
        .upsert(salesData, {
          onConflict: 'sold_at,menu_id,branch_id',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('Upsert error for row:', row, upsertError);
        errors.push(
          `${row.menu_name} (${row.sold_at}) 업로드 실패: ${upsertError.message}`,
        );
      } else {
        if (isUpdate) {
          updatedCount++;
        } else {
          insertedCount++;
        }
      }
    }

    // 경로 재검증
    revalidatePath('/sales');
    revalidatePath('/dashboard');
    revalidatePath('/recipes');

    return {
      success: errors.length === 0,
      inserted: insertedCount,
      updated: updatedCount,
      menusCreated: menusCreatedCount,
      errors,
    };
  } catch (error) {
    console.error('Upload sales error:', error);
    return {
      success: false,
      inserted: insertedCount,
      updated: updatedCount,
      menusCreated: menusCreatedCount,
      errors: ['업로드 중 예상치 못한 오류가 발생했습니다.'],
    };
  }
}

/**
 * 판매 데이터 삭제
 */
export async function deleteSale(saleId: number): Promise<{ success: boolean }> {
  const supabase = createServiceRoleClient();

  try {
    const { error } = await supabase
      .from('menu_sales')
      .delete()
      .eq('id', saleId);

    if (error) {
      console.error('Delete sale error:', error);
      return { success: false };
    }

    revalidatePath('/sales');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Delete sale error:', error);
    return { success: false };
  }
}

/**
 * 기존 메뉴 목록 조회 (미리보기용)
 */
export async function getExistingMenuNames(branchId: string): Promise<string[]> {
  const supabase = createServiceRoleClient();

  const { data } = await supabase
    .from('menus')
    .select('menu_name')
    .eq('branch_id', branchId);

  return data?.map(m => m.menu_name) || [];
}

/**
 * 판매 데이터 새로고침 (테이블 업데이트용)
 */
export async function refreshSalesData(branchId: string): Promise<MenuSale[]> {
  return await getSalesHistory(branchId);
}
