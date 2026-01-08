import { createServiceRoleClient } from '@/utils/supabase/server';
import type { Sale, UserContext, Branch } from '@/types';

// ========== 날짜 유틸리티 함수들 ==========

// 테스트용 고정 날짜 (나중에 실제 날짜로 변경 시 이 값만 수정하면 됨)
const USE_FIXED_DATE = true; // false로 바꾸면 실제 오늘 날짜 사용
const FIXED_TODAY = '2025-01-02';

// 타임존 설정 - 환경변수로 관리 (기본값: 한국)
// 한국: 'Asia/Seoul', 미국 동부: 'America/New_York', 미국 서부: 'America/Los_Angeles'
const TIMEZONE = process.env.TIMEZONE;

/**
 * 지정된 타임존 기준 오늘 날짜를 반환 (YYYY-MM-DD 형식)
 */
export function getToday(): string {
  if (USE_FIXED_DATE) {
    return FIXED_TODAY;
  }
  // 타임존 기준 날짜 반환
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
}

/**
 * 어제 날짜를 반환 (YYYY-MM-DD 형식)
 */
export function getYesterday(): string {
  const today = new Date(getToday());
  today.setDate(today.getDate() - 1);
  return today.toISOString().split('T')[0];
}

/**
 * N일 전 날짜를 반환 (YYYY-MM-DD 형식)
 */
export function getDaysAgo(days: number): string {
  const today = new Date(getToday());
  today.setDate(today.getDate() - days);
  return today.toISOString().split('T')[0];
}

/**
 * 이번 주 시작일 (월요일) 반환
 */
export function getWeekStart(): string {
  const today = new Date(getToday());
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
  today.setDate(diff);
  return today.toISOString().split('T')[0];
}

/**
 * 이번 달 시작일 반환
 */
export function getMonthStart(): string {
  const today = new Date(getToday());
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    '0',
  )}-01`;
}

/**
 * N개월 전 날짜를 반환
 */
export function getMonthsAgo(months: number): string {
  const today = new Date(getToday());
  today.setMonth(today.getMonth() - months);
  return today.toISOString().split('T')[0];
}

/**
 * timestamptz 쿼리를 위한 날짜 범위 반환
 * 시작일 00:00:00 ~ 종료일 23:59:59
 */
export function getDateRange(
  startDate: string,
  endDate: string,
): { start: string; end: string } {
  return {
    start: `${startDate}T00:00:00`,
    end: `${endDate}T23:59:59`,
  };
}

/**
 * 하루 전체 범위 반환 (timestamptz용)
 */
export function getDayRange(date: string): { start: string; end: string } {
  return getDateRange(date, date);
}

// ========== 대시보드용 함수들 ==========

/**
 * 기간별 총 매출액 계산
 */
async function getTotalSalesForPeriod(
  startDate: string,
  endDate: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const range = getDateRange(startDate, endDate);

  const { data } = await supabase
    .from('menu_sales')
    .select('total_sales')
    .gte('sold_at', range.start)
    .lte('sold_at', range.end);

  if (!data) return 0;
  return data.reduce((sum, row) => sum + (row.total_sales || 0), 0);
}

/**
 * 대시보드 매출 요약 (현재 기간 + 이전 기간 비교)
 * 어제 vs 그저께, 이번주 vs 저번주, 이번달 vs 저번달
 */
export async function getDashboardSalesSummary() {
  const yesterday = getYesterday();
  const dayBeforeYesterday = getDaysAgo(2);

  // 이번 주 (7일)
  const weekStart = getDaysAgo(7);
  const weekEnd = yesterday;
  // 저번 주 (14일 전 ~ 8일 전)
  const prevWeekStart = getDaysAgo(14);
  const prevWeekEnd = getDaysAgo(8);

  // 이번 달 (30일)
  const monthStart = getDaysAgo(30);
  const monthEnd = yesterday;
  // 저번 달 (60일 전 ~ 31일 전)
  const prevMonthStart = getDaysAgo(60);
  const prevMonthEnd = getDaysAgo(31);

  const [
    yesterdaySales,
    dayBeforeSales,
    weekSales,
    prevWeekSales,
    monthSales,
    prevMonthSales,
  ] = await Promise.all([
    getTotalSalesForPeriod(yesterday, yesterday),
    getTotalSalesForPeriod(dayBeforeYesterday, dayBeforeYesterday),
    getTotalSalesForPeriod(weekStart, weekEnd),
    getTotalSalesForPeriod(prevWeekStart, prevWeekEnd),
    getTotalSalesForPeriod(monthStart, monthEnd),
    getTotalSalesForPeriod(prevMonthStart, prevMonthEnd),
  ]);

  // 증감률 계산
  const calcChangeRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    yesterday: {
      total: yesterdaySales,
      change: calcChangeRate(yesterdaySales, dayBeforeSales),
    },
    week: {
      total: weekSales,
      change: calcChangeRate(weekSales, prevWeekSales),
    },
    month: {
      total: monthSales,
      change: calcChangeRate(monthSales, prevMonthSales),
    },
  };
}

/**
 * 일별 매출 추이 (최근 N일)
 * 최적화: 한 번의 쿼리로 전체 기간 데이터를 가져온 후 그룹핑
 */
export async function getDailySalesTrend(days: number = 7) {
  const supabase = createServiceRoleClient();
  const startDate = getDaysAgo(days);
  const endDate = getYesterday();
  const range = getDateRange(startDate, endDate);

  // 한 번의 쿼리로 전체 기간 데이터 가져오기
  const { data } = await supabase
    .from('menu_sales')
    .select('total_sales, sales_count, sold_at')
    .gte('sold_at', range.start)
    .lte('sold_at', range.end);

  // 날짜별로 그룹핑
  const dailyMap = new Map<string, { total: number; count: number }>();

  // 모든 날짜 초기화 (데이터가 없는 날도 포함)
  for (let i = days; i >= 1; i--) {
    const date = getDaysAgo(i);
    dailyMap.set(date, { total: 0, count: 0 });
  }

  // 데이터 집계
  data?.forEach((row) => {
    const date = row.sold_at.split('T')[0]; // YYYY-MM-DD 추출
    const existing = dailyMap.get(date);
    if (existing) {
      existing.total += row.total_sales || 0;
      existing.count += row.sales_count || 0;
    }
  });

  // 결과 배열로 변환 (날짜 순서 유지)
  const result: { date: string; total: number; count: number }[] = [];
  for (let i = days; i >= 1; i--) {
    const date = getDaysAgo(i);
    const dayData = dailyMap.get(date) || { total: 0, count: 0 };
    result.push({
      date,
      total: dayData.total,
      count: dayData.count,
    });
  }

  return result;
}

/**
 * 카테고리별 매출 집계
 */
export async function getSalesByCategory(days: number = 30) {
  const supabase = createServiceRoleClient();
  const startDate = getDaysAgo(days);
  const endDate = getYesterday();
  const range = getDateRange(startDate, endDate);

  const { data, error } = await supabase
    .from('menu_sales')
    .select('total_sales, menus(category)')
    .gte('sold_at', range.start)
    .lte('sold_at', range.end);

  if (error || !data) return [];

  // 카테고리별 집계
  const categoryMap = new Map<string, number>();

  data.forEach(
    (row: {
      total_sales: number;
      menus: { category: string } | { category: string }[] | null;
    }) => {
      const category = Array.isArray(row.menus)
        ? row.menus[0]?.category
        : row.menus?.category || '기타';

      const existing = categoryMap.get(category) || 0;
      categoryMap.set(category, existing + (row.total_sales || 0));
    },
  );

  return Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * 인기 메뉴 TOP N (판매 수량 기준)
 */
export async function getTopSellingMenus(limit: number = 5, days: number = 30) {
  const supabase = createServiceRoleClient();
  const startDate = getDaysAgo(days);
  const endDate = getYesterday();
  const range = getDateRange(startDate, endDate);

  const { data, error } = await supabase
    .from('menu_sales')
    .select('menu_id, total_sales, sales_count, menus(menu_name, category)')
    .gte('sold_at', range.start)
    .lte('sold_at', range.end);

  if (error || !data) return [];

  // 메뉴별 집계
  const menuMap = new Map<
    number,
    {
      menu_id: number;
      menu_name: string;
      category: string;
      total_sales: number;
      sales_count: number;
    }
  >();

  data.forEach(
    (row: {
      menu_id: number;
      total_sales: number;
      sales_count: number;
      menus:
        | { menu_name: string; category: string }
        | { menu_name: string; category: string }[]
        | null;
    }) => {
      const existing = menuMap.get(row.menu_id);
      const menuName = Array.isArray(row.menus)
        ? row.menus[0]?.menu_name
        : row.menus?.menu_name || 'Unknown';
      const category = Array.isArray(row.menus)
        ? row.menus[0]?.category
        : row.menus?.category || '기타';

      if (existing) {
        existing.total_sales += row.total_sales;
        existing.sales_count += row.sales_count;
      } else {
        menuMap.set(row.menu_id, {
          menu_id: row.menu_id,
          menu_name: menuName,
          category,
          total_sales: row.total_sales,
          sales_count: row.sales_count,
        });
      }
    },
  );

  return Array.from(menuMap.values())
    .sort((a, b) => b.sales_count - a.sales_count)
    .slice(0, limit);
}

/**
 * 최근 입출고 내역 (최근 N건)
 */
export async function getRecentStockMovements(limit: number = 5): Promise<
  {
    id: number;
    ingredient_name: string;
    movement_type: string;
    quantity: number;
    created_at: string;
  }[]
> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('stock_movements')
    .select(
      'id, movement_type, quantity, created_at, ingredients(ingredient_name)',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentStockMovements error:', error);
    return [];
  }

  return (data || []).map(
    (item: {
      id: number;
      movement_type: string;
      quantity: number;
      created_at: string;
      ingredients:
        | { ingredient_name: string }
        | { ingredient_name: string }[]
        | null;
    }) => ({
      id: item.id,
      movement_type: item.movement_type,
      quantity: item.quantity,
      created_at: item.created_at,
      ingredient_name: Array.isArray(item.ingredients)
        ? item.ingredients[0]?.ingredient_name
        : item.ingredients?.ingredient_name || 'Unknown',
    }),
  );
}

export async function getSales() {
  const supabase = createServiceRoleClient();
  const { data: sales } = await supabase
    .from('menu_sales')
    .select('*, menus(menu_name)');
  return sales;
}

export async function getSalesByPeriods() {
  const supabase = createServiceRoleClient();

  // 날짜 계산 (현재 11월 1일 기준)
  const yesterday = getYesterday();
  const weekAgo = getDaysAgo(7);
  const monthAgo = getMonthsAgo(1);

  // timestamptz를 위한 날짜 범위
  const yesterdayRange = getDayRange(yesterday);
  const weekRange = getDateRange(weekAgo, yesterday);
  const monthRange = getDateRange(monthAgo, yesterday);

  // 1. 각 기간별 전체 row를 가져옴 (limit 없이)
  const [dayRows, weekRows, monthRows] = await Promise.all([
    supabase
      .from('menu_sales')
      .select('*, menus(menu_name)')
      .gte('sold_at', yesterdayRange.start)
      .lte('sold_at', yesterdayRange.end),
    supabase
      .from('menu_sales')
      .select('*, menus(menu_name)')
      .gte('sold_at', weekRange.start)
      .lte('sold_at', weekRange.end),
    supabase
      .from('menu_sales')
      .select('*, menus(menu_name)')
      .gte('sold_at', monthRange.start)
      .lte('sold_at', monthRange.end),
  ]);

  // 2. menu_id로 합산(group by) 후 total_sales 기준 상위 3개만 추출
  function groupAndTop3(rows: Sale[] | null) {
    if (!rows) return [];
    const merged = rows.reduce((acc, cur) => {
      const found = acc.find((item: Sale) => item.menu_id === cur.menu_id);
      if (found) {
        found.total_sales += cur.total_sales;
        found.sales_count += cur.sales_count;
      } else {
        acc.push({
          ...cur,
          menu_name:
            cur.menus?.menu_name ||
            (Array.isArray(cur.menus) ? cur.menus[0]?.menu_name : 'Unknown'),
        });
      }
      return acc;
    }, [] as Sale[]);
    // menus 필드 제거(선택)
    merged.forEach((item: Sale) => {
      delete item.menus;
    });

    return merged.sort((a, b) => b.total_sales - a.total_sales);
  }

  return {
    daySales: groupAndTop3(dayRows.data),
    weekSales: groupAndTop3(weekRows.data),
    monthSales: groupAndTop3(monthRows.data),
  };
}

export async function getAllIngredients() {
  const supabase = createServiceRoleClient();
  const { data: ingredients } = await supabase.from('ingredients').select('*');
  return ingredients;
}

// 재료 추가
export async function createIngredient(input: {
  ingredient_name: string;
  category?: string;
  unit: string;
  price?: number;
  current_qty?: number;
  reorder_point?: number;
  safety_stock?: number;
  branch_id: string;
}): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  const supabase = createServiceRoleClient();

  // 중복 체크: 같은 branch_id 내에서 같은 이름 확인
  const { data: existing } = await supabase
    .from('ingredients')
    .select('id')
    .eq('branch_id', input.branch_id)
    .eq('ingredient_name', input.ingredient_name)
    .maybeSingle();

  if (existing) {
    return { success: false, error: '이미 같은 이름의 재료가 존재합니다.' };
  }

  // 재료 추가
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      ingredient_id: `ING-${Date.now()}`,
      ingredient_name: input.ingredient_name,
      category: input.category || null,
      unit: input.unit,
      price: input.price || 0,
      current_qty: input.current_qty || 0,
      reorder_point: input.reorder_point ?? null,
      safety_stock: input.safety_stock || 0,
      branch_id: input.branch_id,
    })
    .select()
    .single();

  if (error) {
    console.error('createIngredient error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 재료 수정
export async function updateIngredient(
  id: string,
  input: {
    ingredient_name?: string;
    category?: string;
    unit?: string;
    price?: number | null;
    reorder_point?: number | null;
    safety_stock?: number | null;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('ingredients')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('updateIngredient error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getAllRecipes() {
  const supabase = createServiceRoleClient();
  const { data: recipes, error } = await supabase
    .from('menu_recipes')
    .select(
      `
      *,
      menus:menu_id ( menu_id, menu_name )
    `,
    )
    .order('menu_id', { ascending: true });

  if (error) {
    console.error('getAllRecipes error:', error);
  }

  return recipes;
}
// export async function getAllRecipes() {
//   const supabase = await createClient();
//   const { data: recipes, error } = await supabase
//     .from('menu_recipes')
//     .select(
//       `
//       required_qty, unit, loss_rate,
//       menus:menu_id ( menu_id, menu_name ),
//       ingredients:ingredient_id ( ingredient_id, ingredient_name )
//     `,
//     )
//     .order('menu_id', { ascending: true });

//   if (error) {
//     console.error('getAllRecipes error:', error);
//   }

//   return recipes;
// }

export async function fetchMenuRecipeIngredients(menuId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('menu_recipes')
    .select(
      `
    required_qty, unit, loss_rate,
    menus:menu_id ( menu_id, menu_name, category ),
    ingredients:ingredient_id ( ingredient_id, ingredient_name, category )
  `,
    )
    .eq('menu_id', menuId)
    .order('ingredient_id', { ascending: true }); // 기준: menu_recipes.ingredient_id

  if (error) {
    console.error('Error fetching top ingredients:', error);
    return [];
  }
  return data;
}

// ========== Reports 페이지용 함수들 ==========

// 1. 매출 리포트 - 기간별 매출 요약
export async function getSalesReport(startDate: string, endDate: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('menu_sales')
    .select('*, menus(menu_name, category)')
    .gte('sold_at', startDate)
    .lte('sold_at', endDate)
    .order('sold_at', { ascending: false });

  if (error) {
    console.error('getSalesReport error:', error);
    return [];
  }

  return data || [];
}

// 메뉴별 매출 집계
export async function getSalesByMenu(startDate: string, endDate: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('menu_sales')
    .select('menu_id, total_sales, sales_count, menus(menu_name, category)')
    .gte('sold_at', startDate)
    .lte('sold_at', endDate);

  if (error) {
    console.error('getSalesByMenu error:', error);
    return [];
  }

  // 메뉴별 집계
  const menuMap = new Map<
    number,
    {
      menu_id: number;
      menu_name: string;
      category: string;
      total_sales: number;
      sales_count: number;
    }
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?.forEach((row: any) => {
    const existing = menuMap.get(row.menu_id);
    const menuName = Array.isArray(row.menus)
      ? row.menus[0]?.menu_name
      : row.menus?.menu_name || 'Unknown';
    const category = Array.isArray(row.menus)
      ? row.menus[0]?.category
      : row.menus?.category || 'Unknown';

    if (existing) {
      existing.total_sales += row.total_sales;
      existing.sales_count += row.sales_count;
    } else {
      menuMap.set(row.menu_id, {
        menu_id: row.menu_id,
        menu_name: menuName,
        category: category,
        total_sales: row.total_sales,
        sales_count: row.sales_count,
      });
    }
  });

  return Array.from(menuMap.values()).sort(
    (a, b) => b.total_sales - a.total_sales,
  );
}

// 2. 재고 리포트 - 현재 재고 현황
export async function getInventoryReport() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('ingredient_name', { ascending: true });

  if (error) {
    console.error('getInventoryReport error:', error);
    return [];
  }

  return data || [];
}

// 재고 부족 재료 (임계치 이하 또는 NULL)
export async function getLowStockIngredients(threshold: number = 10) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .or(`current_qty.lt.${threshold},current_qty.is.null`)
    .order('current_qty', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('getLowStockIngredients error:', error);
    return [];
  }

  return data || [];
}

// 3. 레시피/메뉴 분석 - 메뉴 목록과 원가 정보
export async function getMenuAnalysis() {
  const supabase = createServiceRoleClient();

  // 메뉴 정보 가져오기
  const { data: menus, error: menuError } = await supabase
    .from('menus')
    .select('*')
    .order('menu_name', { ascending: true });

  if (menuError) {
    console.error('getMenuAnalysis menus error:', menuError);
    return [];
  }

  // 레시피 정보 가져오기 (원가 계산용)
  const { data: recipes, error: recipeError } = await supabase.from(
    'menu_recipes',
  ).select(`
      menu_id,
      required_qty,
      ingredients:ingredient_id (
        ingredient_id,
        ingredient_name,
        unit_price
      )
    `);

  if (recipeError) {
    console.error('getMenuAnalysis recipes error:', recipeError);
    return menus || [];
  }

  // 메뉴별 원가 계산
  const menuCostMap = new Map<number, number>();
  recipes?.forEach((recipe) => {
    const ingredient = Array.isArray(recipe.ingredients)
      ? recipe.ingredients[0]
      : recipe.ingredients;
    const unitPrice = ingredient?.unit_price || 0;
    const cost = recipe.required_qty * unitPrice;

    const existing = menuCostMap.get(recipe.menu_id) || 0;
    menuCostMap.set(recipe.menu_id, existing + cost);
  });

  // 메뉴에 원가 정보 추가
  return (
    menus?.map((menu) => ({
      ...menu,
      estimated_cost: menuCostMap.get(menu.menu_id) || 0,
      cost_ratio: menu.price
        ? ((menuCostMap.get(menu.menu_id) || 0) / menu.price) * 100
        : 0,
    })) || []
  );
}

// 인기 메뉴 Top N
export async function getTopMenus(limit: number = 10) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('menu_sales')
    .select('menu_id, total_sales, sales_count, menus(menu_name, category)');

  if (error) {
    console.error('getTopMenus error:', error);
    return [];
  }

  // 메뉴별 집계
  const menuMap = new Map<
    number,
    {
      menu_id: number;
      menu_name: string;
      category: string;
      total_sales: number;
      sales_count: number;
    }
  >();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?.forEach((row: any) => {
    const existing = menuMap.get(row.menu_id);
    const menuName = Array.isArray(row.menus)
      ? row.menus[0]?.menu_name
      : row.menus?.menu_name || 'Unknown';
    const category = Array.isArray(row.menus)
      ? row.menus[0]?.category
      : row.menus?.category || 'Unknown';

    if (existing) {
      existing.total_sales += row.total_sales;
      existing.sales_count += row.sales_count;
    } else {
      menuMap.set(row.menu_id, {
        menu_id: row.menu_id,
        menu_name: menuName,
        category: category,
        total_sales: row.total_sales,
        sales_count: row.sales_count,
      });
    }
  });

  return Array.from(menuMap.values())
    .sort((a, b) => b.sales_count - a.sales_count)
    .slice(0, limit);
}

// 4. 재고 이동 내역
export async function getStockMovements(
  startDate?: string,
  endDate?: string,
): Promise<StockMovement[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('stock_movements')
    .select('*, ingredients(ingredient_name, unit)')
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getStockMovements error:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    ...item,
    ingredient_name: item.ingredients?.ingredient_name,
    ingredient_unit: item.ingredients?.unit,
  }));
}

// 재고 이동 요약 (입고/출고/폐기별 합계)
export async function getStockMovementsSummary(
  startDate?: string,
  endDate?: string,
) {
  const movements = await getStockMovements(startDate, endDate);

  const summary = {
    incoming: 0, // 입고
    outgoing: 0, // 출고
    waste: 0, // 폐기
    adjustment: 0, // 조정
  };

  movements.forEach((m) => {
    switch (m.movement_type) {
      case 'in':
        summary.incoming += m.quantity || 0;
        break;
      case 'out':
        summary.outgoing += m.quantity || 0;
        break;
      case 'waste':
        summary.waste += m.quantity || 0;
        break;
      case 'adjustment':
        summary.adjustment += m.quantity || 0;
        break;
    }
  });

  return summary;
}

// ========== 재고 이동 CRUD 함수들 ==========

import type {
  BusinessSettings,
  InventorySettings,
  RecipeSettings,
  ReportSettings,
  NotificationSettings,
  SystemSettings,
  UserPermission,
  StockMovement,
  StockMovementInput,
} from '@/types';

// 재고 이동 내역 조회 (페이지네이션, 필터링 지원)
export async function getStockMovementsPaginated(options?: {
  page?: number;
  limit?: number;
  movementType?: string;
  ingredientId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: StockMovement[]; total: number }> {
  const supabase = createServiceRoleClient();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('stock_movements')
    .select('*, ingredients(ingredient_name, unit)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.movementType) {
    query = query.eq('movement_type', options.movementType);
  }
  if (options?.ingredientId) {
    query = query.eq('ingredient_id', options.ingredientId);
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('getStockMovementsPaginated error:', error);
    return { data: [], total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedData: StockMovement[] = (data || []).map((item: any) => ({
    id: item.id,
    ingredient_id: item.ingredient_id,
    movement_type: item.movement_type,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    reason: item.reason,
    reference_no: item.reference_no,
    supplier: item.supplier,
    note: item.note,
    created_at: item.created_at,
    updated_at: item.updated_at,
    ingredient_name: Array.isArray(item.ingredients)
      ? item.ingredients[0]?.ingredient_name
      : item.ingredients?.ingredient_name,
    ingredient_unit: Array.isArray(item.ingredients)
      ? item.ingredients[0]?.unit
      : item.ingredients?.unit,
  }));

  return { data: formattedData, total: count || 0 };
}

// 재고 이동 등록 (입고/출고/폐기/조정)
export async function createStockMovement(
  input: StockMovementInput,
): Promise<{ success: boolean; data?: StockMovement; error?: string }> {
  const supabase = createServiceRoleClient();

  // 총 금액 계산
  const totalPrice = input.unit_price
    ? input.quantity * input.unit_price
    : undefined;

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      ingredient_id: input.ingredient_id,
      movement_type: input.movement_type,
      quantity: input.quantity,
      unit_price: input.unit_price,
      total_price: totalPrice,
      reason: input.reason,
      reference_no: input.reference_no,
      supplier: input.supplier,
      note: input.note,
    })
    .select()
    .single();

  if (error) {
    console.error('createStockMovement error:', error);
    return { success: false, error: error.message };
  }

  // 재고 수량 업데이트
  const quantityChange =
    input.movement_type === 'in'
      ? input.quantity
      : input.movement_type === 'adjustment'
        ? input.quantity // 조정은 입력값 그대로 (양수면 증가, 음수면 감소)
        : -input.quantity; // out, waste는 감소

  const { error: updateError } = await supabase.rpc('update_ingredient_stock', {
    p_ingredient_id: input.ingredient_id,
    p_quantity_change: quantityChange,
  });

  // RPC가 없으면 직접 업데이트
  if (updateError) {
    console.log('RPC not available, updating directly');
    const { data: ingredient } = await supabase
      .from('ingredients')
      .select('current_qty')
      .eq('id', input.ingredient_id)
      .single();

    if (ingredient) {
      await supabase
        .from('ingredients')
        .update({
          current_qty: (ingredient.current_qty || 0) + quantityChange,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.ingredient_id);
    }
  }

  return { success: true, data };
}

// 재고 이동 수정
export async function updateStockMovement(
  id: number,
  input: Partial<StockMovementInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // 총 금액 재계산
  if (input.quantity !== undefined && input.unit_price !== undefined) {
    updateData.total_price = input.quantity * input.unit_price;
  }

  const { error } = await supabase
    .from('stock_movements')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('updateStockMovement error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 재고 이동 삭제
export async function deleteStockMovement(
  id: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  // 먼저 이동 내역 조회 (재고 복구용)
  const { data: movement } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('id', id)
    .single();

  if (!movement) {
    return { success: false, error: 'Movement not found' };
  }

  // 삭제 실행
  const { error } = await supabase.from('stock_movements').delete().eq('id', id);

  if (error) {
    console.error('deleteStockMovement error:', error);
    return { success: false, error: error.message };
  }

  // 재고 수량 복구 (삭제된 이동의 반대 방향)
  const quantityRestore =
    movement.movement_type === 'in'
      ? -movement.quantity
      : movement.movement_type === 'adjustment'
        ? -movement.quantity
        : movement.quantity;

  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('current_qty')
    .eq('id', movement.ingredient_id)
    .single();

  if (ingredient) {
    await supabase
      .from('ingredients')
      .update({
        current_qty: (ingredient.current_qty || 0) + quantityRestore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', movement.ingredient_id);
  }

  return { success: true };
}

// 재료별 재고 이동 내역 조회
export async function getMovementsByIngredient(
  ingredientId: number,
  limit: number = 10,
): Promise<StockMovement[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getMovementsByIngredient error:', error);
    return [];
  }

  return data || [];
}

// 비즈니스 설정
export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .single();

  if (error) {
    console.error('getBusinessSettings error:', error);
    return null;
  }
  return data;
}

export async function updateBusinessSettings(
  settings: Partial<BusinessSettings>,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('business_settings')
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateBusinessSettings error:', error);
    return false;
  }
  return true;
}

// 재고 설정
export async function getInventorySettings(): Promise<InventorySettings | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('inventory_settings')
    .select('*')
    .single();

  if (error) {
    console.error('getInventorySettings error:', error);
    return null;
  }
  return data;
}

export async function updateInventorySettings(
  settings: Partial<InventorySettings>,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('inventory_settings')
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateInventorySettings error:', error);
    return false;
  }
  return true;
}

// 레시피 설정
export async function getRecipeSettings(): Promise<RecipeSettings | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('recipe_settings')
    .select('*')
    .single();

  if (error) {
    console.error('getRecipeSettings error:', error);
    return null;
  }
  return data;
}

export async function updateRecipeSettings(
  settings: Partial<RecipeSettings>,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('recipe_settings')
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateRecipeSettings error:', error);
    return false;
  }
  return true;
}

// 리포트 설정
export async function getReportSettings(): Promise<ReportSettings | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('report_settings')
    .select('*')
    .single();

  if (error) {
    console.error('getReportSettings error:', error);
    return null;
  }
  return data;
}

export async function updateReportSettings(
  settings: Partial<ReportSettings>,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('report_settings')
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateReportSettings error:', error);
    return false;
  }
  return true;
}

// 알림 설정
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .single();

  if (error) {
    console.error('getNotificationSettings error:', error);
    return null;
  }
  return data;
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('notification_settings')
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateNotificationSettings error:', error);
    return false;
  }
  return true;
}

// 시스템 설정
export async function getSystemSettings(): Promise<SystemSettings | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .single();

  if (error) {
    console.error('getSystemSettings error:', error);
    return null;
  }
  return data;
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('system_settings')
    .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateSystemSettings error:', error);
    return false;
  }
  return true;
}

// 사용자 권한 관리
export async function getUserPermissions(): Promise<UserPermission[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getUserPermissions error:', error);
    return [];
  }
  return data || [];
}

export async function updateUserPermission(
  permission: Partial<UserPermission> & { user_id: string },
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('user_permissions')
    .upsert({ ...permission, updated_at: new Date().toISOString() });

  if (error) {
    console.error('updateUserPermission error:', error);
    return false;
  }
  return true;
}

export async function deleteUserPermission(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('deleteUserPermission error:', error);
    return false;
  }
  return true;
}

// 모든 설정 한번에 가져오기
export async function getAllSettings() {
  const [business, inventory, recipe, report, notification, system, users] =
    await Promise.all([
      getBusinessSettings(),
      getInventorySettings(),
      getRecipeSettings(),
      getReportSettings(),
      getNotificationSettings(),
      getSystemSettings(),
      getUserPermissions(),
    ]);

  return {
    business,
    inventory,
    recipe,
    report,
    notification,
    system,
    users,
  };
}

// ========== 급여/근태 관리 함수들 ==========

// 급여 설정 조회
export async function getSalarySettings() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('salary_settings')
    .select('*, user_permissions(user_name, user_email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getSalarySettings error:', error);
    return [];
  }
  return data || [];
}

// 특정 사용자 급여 설정 조회
export async function getSalarySettingByUserId(userId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('salary_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('getSalarySettingByUserId error:', error);
    return null;
  }
  return data;
}

// 급여 설정 저장/수정
export async function upsertSalarySetting(
  setting: Partial<import('@/types').SalarySetting> & { user_id: string },
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('salary_settings')
    .upsert({ ...setting, updated_at: new Date().toISOString() });

  if (error) {
    console.error('upsertSalarySetting error:', error);
    return false;
  }
  return true;
}

// 근무 기록 조회 (기간별)
export async function getWorkRecords(
  startDate: string,
  endDate: string,
  userId?: string,
) {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from('work_records')
    .select('*, user_permissions(user_name, user_email)')
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .order('work_date', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getWorkRecords error:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((record: any) => ({
    ...record,
    user_name: record.user_permissions?.user_name,
    user_email: record.user_permissions?.user_email,
  }));
}

// 근무 기록 추가/수정
export async function upsertWorkRecord(
  record: Partial<import('@/types').WorkRecord> & {
    user_id: string;
    work_date: string;
  },
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // 근무 시간 계산
  let workMinutes = 0;
  if (record.clock_in && record.clock_out) {
    const clockIn = new Date(`2000-01-01T${record.clock_in}`);
    const clockOut = new Date(`2000-01-01T${record.clock_out}`);
    workMinutes =
      Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000) -
      (record.break_minutes || 0);
  }

  const { error } = await supabase.from('work_records').upsert({
    ...record,
    work_minutes: workMinutes,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('upsertWorkRecord error:', error);
    return false;
  }
  return true;
}

// 근무 기록 삭제
export async function deleteWorkRecord(id: number): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('work_records').delete().eq('id', id);

  if (error) {
    console.error('deleteWorkRecord error:', error);
    return false;
  }
  return true;
}

// 급여 내역 조회
export async function getPayrolls(year: number, month?: number) {
  const supabase = createServiceRoleClient();

  let startDate: string;
  let endDate: string;

  if (month) {
    startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  } else {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  const { data, error } = await supabase
    .from('payroll')
    .select('*, user_permissions(user_name, user_email)')
    .gte('pay_period_start', startDate)
    .lte('pay_period_end', endDate)
    .order('pay_period_start', { ascending: false });

  if (error) {
    console.error('getPayrolls error:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((payroll: any) => ({
    ...payroll,
    user_name: payroll.user_permissions?.user_name,
    user_email: payroll.user_permissions?.user_email,
  }));
}

// 급여 계산 및 생성
export async function calculateAndCreatePayroll(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<import('@/types').Payroll | null> {
  const supabase = createServiceRoleClient();

  // 1. 급여 설정 가져오기
  const salarySetting = await getSalarySettingByUserId(userId);
  if (!salarySetting) {
    console.error('No salary setting found for user:', userId);
    return null;
  }

  // 2. 해당 기간 근무 기록 가져오기
  const workRecords = await getWorkRecords(periodStart, periodEnd, userId);

  // 3. 급여 계산
  let totalWorkMinutes = 0;
  let overtimeMinutes = 0;
  const totalWorkDays = workRecords.length;

  workRecords.forEach((record) => {
    totalWorkMinutes += record.work_minutes || 0;
    overtimeMinutes += record.overtime_minutes || 0;
  });

  const hourlyRate = salarySetting.hourly_rate || 9860;
  const basePay = Math.floor((totalWorkMinutes / 60) * hourlyRate);
  const overtimePay = Math.floor(
    (overtimeMinutes / 60) * hourlyRate * (salarySetting.overtime_rate || 1.5),
  );
  const netPay = basePay + overtimePay;

  // 4. 급여 내역 저장
  const payroll = {
    user_id: userId,
    pay_period_start: periodStart,
    pay_period_end: periodEnd,
    total_work_days: totalWorkDays,
    total_work_minutes: totalWorkMinutes,
    overtime_minutes: overtimeMinutes,
    base_pay: basePay,
    overtime_pay: overtimePay,
    night_pay: 0,
    weekend_pay: 0,
    bonus: 0,
    deductions: 0,
    net_pay: netPay,
    status: 'draft' as const,
  };

  const { data, error } = await supabase
    .from('payroll')
    .upsert(payroll)
    .select()
    .single();

  if (error) {
    console.error('calculateAndCreatePayroll error:', error);
    return null;
  }

  return data;
}

// 급여 상태 업데이트
export async function updatePayrollStatus(
  id: number,
  status: import('@/types').PayrollStatus,
  paidAt?: string,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('payroll')
    .update({
      status,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('updatePayrollStatus error:', error);
    return false;
  }
  return true;
}

// ========== 사용자 컨텍스트 관련 함수들 ==========

// 사용자 컨텍스트 조회
export async function getUserContext(userId: string): Promise<UserContext> {
  const supabase = createServiceRoleClient();

  // 1. 사용자의 브랜드 멤버십 조회 (기본 브랜드 우선)
  const { data: brandMembers } = await supabase
    .from('brand_members')
    .select('*, brands(*)')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  const defaultBrandMember = brandMembers?.find((m) => m.is_default);
  const currentBrand = defaultBrandMember?.brands || brandMembers?.[0]?.brands;

  // 2. B2C 모드: 브랜드의 기본 지점 직접 조회 (branch_members 사용 안함)
  let currentBranch: Branch | undefined;
  if (currentBrand) {
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .eq('brand_id', currentBrand.id)
      .limit(1);
    currentBranch = branches?.[0];
  }

  return {
    userId,
    currentBrand,
    currentBranch,
    userRole: defaultBrandMember?.role,
    availableBranches: currentBranch ? [currentBranch] : [],
  };
}

// 기본 지점 설정 (지점 전환)
export async function setDefaultBranch(
  userId: string,
  branchId: string,
): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // 1. 기존 기본 지점 해제
  await supabase
    .from('branch_members')
    .update({ is_default: false })
    .eq('user_id', userId);

  // 2. 새 기본 지점 설정
  const { error } = await supabase
    .from('branch_members')
    .update({ is_default: true })
    .eq('user_id', userId)
    .eq('branch_id', branchId);

  if (error) {
    console.error('setDefaultBranch error:', error);
    return false;
  }

  return true;
}

// 메뉴 카테고리 목록 조회 (해당 지점의 기존 카테고리들)
export async function getMenuCategories(branchId?: string): Promise<string[]> {
  const supabase = createServiceRoleClient();

  let query = supabase.from('menus').select('category');

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getMenuCategories error:', error);
    return [];
  }

  // DISTINCT 처리 및 빈 값 제외
  const categories = [
    ...new Set(
      data?.map((item) => item.category).filter((cat): cat is string => !!cat),
    ),
  ];

  return categories.sort();
}

// 모든 메뉴 정보 조회 (메뉴판 UI용)
export async function getAllMenus(branchId?: string) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('menus')
    .select('menu_id, menu_name, category, category_id, price, image_url')
    .order('category', { ascending: true })
    .order('menu_name', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAllMenus error:', error);
    return [];
  }

  return data || [];
}

// 모든 메뉴 옵션 조회 (메뉴판 UI용)
export async function getAllMenuOptions(branchId?: string) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('menu_options')
    .select('option_id, option_name, option_category, additional_price, image_url, is_active')
    .eq('is_active', true)
    .order('option_category', { ascending: true })
    .order('option_name', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAllMenuOptions error:', error);
    return [];
  }

  return data || [];
}

// ========== 메뉴 카테고리 CRUD 함수들 ==========

import type { MenuCategory, MenuCategoryInput } from '@/types';

// 모든 메뉴 카테고리 조회
export async function getAllMenuCategories(
  branchId?: string,
): Promise<MenuCategory[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getAllMenuCategories error:', error);
    return [];
  }

  return data || [];
}

// 카테고리 생성
export async function createMenuCategory(
  input: MenuCategoryInput,
): Promise<{ success: boolean; data?: MenuCategory; error?: string }> {
  const supabase = createServiceRoleClient();

  // 중복 체크: 같은 branch_id, category_type, name이 있는지 확인
  const { data: existing } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('branch_id', input.branch_id)
    .eq('category_type', input.category_type)
    .eq('name', input.name)
    .maybeSingle();

  if (existing) {
    return { success: false, error: '이미 같은 이름의 카테고리가 존재합니다.' };
  }

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({
      ...input,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('createMenuCategory error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// 카테고리 수정
export async function updateMenuCategory(
  id: string,
  input: Partial<MenuCategoryInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('menu_categories')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('updateMenuCategory error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 카테고리 삭제 (실제로는 is_active를 false로 설정)
export async function deleteMenuCategory(
  id: string,
): Promise<{ success: boolean; error?: string; hasMenus?: boolean }> {
  const supabase = createServiceRoleClient();

  // 1. 해당 카테고리에 메뉴가 있는지 확인
  const { data: menus } = await supabase
    .from('menus')
    .select('menu_id')
    .eq('category_id', id)
    .limit(1);

  if (menus && menus.length > 0) {
    return {
      success: false,
      hasMenus: true,
      error: '카테고리에 메뉴가 있어서 삭제할 수 없습니다.',
    };
  }

  // 2. 소프트 삭제 (is_active = false)
  const { error } = await supabase
    .from('menu_categories')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('deleteMenuCategory error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 카테고리별 메뉴 개수 조회
export async function getMenuCountByCategory(
  branchId?: string,
): Promise<Record<string, number>> {
  const supabase = createServiceRoleClient();

  let query = supabase.from('menus').select('category_id');

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('getMenuCountByCategory error:', error);
    return {};
  }

  // 카테고리별 카운트
  const counts: Record<string, number> = {};
  data?.forEach((menu) => {
    if (menu.category_id) {
      counts[menu.category_id] = (counts[menu.category_id] || 0) + 1;
    }
  });

  return counts;
}

// ========== 판매 관리 (Sales Management) ==========

/**
 * 판매 내역 조회
 * @param branchId - 지점 ID
 * @param startDate - 시작일 (YYYY-MM-DD), 선택적
 * @param endDate - 종료일 (YYYY-MM-DD), 선택적
 * @returns 판매 내역 배열
 */
export async function getSalesHistory(
  branchId: string,
  startDate?: string,
  endDate?: string,
) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('menu_sales')
    .select(
      `
      id,
      menu_id,
      branch_id,
      sold_at,
      sales_count,
      price,
      total_sales,
      created_at,
      updated_at,
      menus!inner (
        menu_name
      )
    `,
    )
    .eq('branch_id', branchId)
    .order('sold_at', { ascending: false });

  // 날짜 필터 적용
  if (startDate) {
    query = query.gte('sold_at', startDate);
  }
  if (endDate) {
    query = query.lte('sold_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sales history:', error);
    return [];
  }

  // menu_name 매핑
  return (
    data?.map((sale) => {
      // menus는 join된 단일 객체 (배열이 아님)
      const menu = sale.menus as unknown as { menu_name: string } | null;
      return {
        ...sale,
        menu_name: menu?.menu_name || '',
      };
    }) || []
  );
}

/**
 * 메뉴 목록 조회 (템플릿 다운로드용)
 * @param branchId - 지점 ID
 * @returns 메뉴 목록
 */
export async function getMenusForTemplate(branchId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('menus')
    .select('id, name, price')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching menus for template:', error);
    return [];
  }

  return data || [];
}
