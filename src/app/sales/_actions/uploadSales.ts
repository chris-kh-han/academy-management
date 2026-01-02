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
 * 판매 데이터 업로드 (배치 처리 - 성능 최적화)
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
    // 유효한 행만 필터링
    const validRows = rows.filter(r => r.menu_name && r.sold_at);
    if (validRows.length === 0) {
      return { success: true, inserted: 0, updated: 0, menusCreated: 0, errors: [] };
    }

    // 1. 기존 데이터 조회 (중복 체크용)
    const dates = [...new Set(validRows.map(r => r.sold_at?.split(' ')[0]).filter(Boolean))];
    let existingKeys = new Set<string>();

    if (dates.length > 0) {
      const sortedDates = [...dates].sort();
      const minDate = sortedDates[0];
      const maxDate = sortedDates[sortedDates.length - 1];

      const { data: existingRecords } = await supabase
        .from('menu_sales')
        .select('sold_at, menu_id')
        .eq('branch_id', branchId)
        .gte('sold_at', `${minDate} 00:00:00`)
        .lte('sold_at', `${maxDate} 23:59:59`);

      existingKeys = new Set(
        existingRecords?.map(e => `${normalizeTimestamp(e.sold_at)}_${e.menu_id}`) || []
      );
    }

    // 2. 메뉴 일괄 조회
    const menuNames = [...new Set(validRows.map(r => r.menu_name.trim()))];
    const { data: existingMenus } = await supabase
      .from('menus')
      .select('menu_id, menu_name, price')
      .eq('branch_id', branchId)
      .in('menu_name', menuNames);

    const menuMap = new Map<string, { menu_id: string; price: number }>(
      existingMenus?.map(m => [m.menu_name, { menu_id: m.menu_id, price: m.price || 0 }]) || []
    );

    // 3. 신규 메뉴 일괄 생성
    const newMenuNames = menuNames.filter(n => !menuMap.has(n));
    if (newMenuNames.length > 0) {
      // 마지막 menu_id 조회
      const { data: lastMenu } = await supabase
        .from('menus')
        .select('menu_id')
        .order('menu_id', { ascending: false })
        .limit(1)
        .single();

      let nextNum = 1;
      if (lastMenu?.menu_id) {
        nextNum = parseInt(lastMenu.menu_id.replace('M', ''), 10) + 1;
      }

      // 신규 메뉴 가격 추출 (CSV에서 가져온 가격 사용)
      const menuPriceMap = new Map<string, number>();
      for (const row of validRows) {
        if (row.price && !menuPriceMap.has(row.menu_name.trim())) {
          menuPriceMap.set(row.menu_name.trim(), row.price);
        }
      }

      const newMenuInserts = newMenuNames.map((name, idx) => ({
        menu_id: `M${String(nextNum + idx).padStart(3, '0')}`,
        menu_name: name,
        price: menuPriceMap.get(name) || 0,
        branch_id: branchId,
      }));

      const { error: menuInsertError } = await supabase
        .from('menus')
        .insert(newMenuInserts);

      if (menuInsertError) {
        console.error('Batch menu insert error:', menuInsertError);
        errors.push(`메뉴 일괄 생성 실패: ${menuInsertError.message}`);
      } else {
        menusCreatedCount = newMenuNames.length;
        // menuMap 업데이트
        for (const menu of newMenuInserts) {
          menuMap.set(menu.menu_name, { menu_id: menu.menu_id, price: menu.price });
        }
      }
    }

    // 4. 판매 데이터 준비
    const salesDataArray: Array<{
      menu_id: string;
      branch_id: string;
      sold_at: string;
      sales_count: number;
      price: number;
      total_sales: number;
      transaction_id: string | null;
      updated_at: string;
    }> = [];

    const now = new Date().toISOString();

    for (const row of validRows) {
      const menuInfo = menuMap.get(row.menu_name.trim());
      if (!menuInfo) {
        errors.push(`메뉴 찾을 수 없음: ${row.menu_name}`);
        continue;
      }

      const price = row.price || menuInfo.price;
      const totalSales = row.total_sales || (price * (row.sales_count || 0));

      // 중복 체크
      const recordKey = `${row.sold_at}_${menuInfo.menu_id}`;
      if (existingKeys.has(recordKey)) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      salesDataArray.push({
        menu_id: menuInfo.menu_id,
        branch_id: branchId,
        sold_at: row.sold_at,
        sales_count: row.sales_count || 0,
        price: price,
        total_sales: totalSales,
        transaction_id: row.transaction_id || null,
        updated_at: now,
      });
    }

    // 5. 판매 데이터 일괄 upsert (1000개씩 청크)
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < salesDataArray.length; i += CHUNK_SIZE) {
      const chunk = salesDataArray.slice(i, i + CHUNK_SIZE);
      const { error: upsertError } = await supabase
        .from('menu_sales')
        .upsert(chunk, {
          onConflict: 'sold_at,menu_id,branch_id',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('Batch upsert error:', upsertError);
        errors.push(`청크 ${Math.floor(i / CHUNK_SIZE) + 1} 업로드 실패: ${upsertError.message}`);
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

/**
 * 날짜 범위로 판매 데이터 조회
 */
export async function fetchSalesByDateRange(
  branchId: string,
  startDate?: string,
  endDate?: string
): Promise<MenuSale[]> {
  return await getSalesHistory(branchId, startDate, endDate);
}

/**
 * 판매 데이터가 존재하는 월 목록 조회
 */
export async function getAvailableMonths(branchId: string): Promise<string[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('menu_sales')
    .select('sold_at')
    .eq('branch_id', branchId)
    .order('sold_at', { ascending: false });

  if (error || !data) {
    console.error('getAvailableMonths error:', error);
    return [];
  }

  // 중복 제거된 월 목록 추출 (YYYY-MM 형식)
  const months = new Set<string>();
  data.forEach((sale) => {
    const month = sale.sold_at?.slice(0, 7);
    if (month) months.add(month);
  });

  return Array.from(months).sort().reverse();
}
