import { createClient } from '@/utils/supabase/server';
import type { Sale } from '@/types';

// ========== 날짜 유틸리티 함수들 ==========

// 테스트용 고정 날짜 (나중에 실제 날짜로 변경 시 이 값만 수정하면 됨)
const USE_FIXED_DATE = true; // false로 바꾸면 실제 오늘 날짜 사용
const FIXED_TODAY = '2025-11-01';

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
  const supabase = await createClient();
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
 */
export async function getDailySalesTrend(days: number = 7) {
  const supabase = await createClient();
  const result: { date: string; total: number; count: number }[] = [];

  // 각 날짜별로 매출 집계
  for (let i = days; i >= 1; i--) {
    const date = getDaysAgo(i);
    const range = getDayRange(date);

    const { data } = await supabase
      .from('menu_sales')
      .select('total_sales, sales_count')
      .gte('sold_at', range.start)
      .lte('sold_at', range.end);

    const dayTotal =
      data?.reduce((sum, row) => sum + (row.total_sales || 0), 0) || 0;
    const dayCount =
      data?.reduce((sum, row) => sum + (row.sales_count || 0), 0) || 0;

    result.push({
      date,
      total: dayTotal,
      count: dayCount,
    });
  }

  return result;
}

/**
 * 카테고리별 매출 집계
 */
export async function getSalesByCategory(days: number = 30) {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from('menu_sales')
    .select('*, menus(menu_name)');
  return sales;
}

export async function getSalesByPeriods() {
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { data: ingredients } = await supabase.from('ingredients').select('*');
  return ingredients;
}

export async function getAllRecipes() {
  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();

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
  const supabase = await createClient();

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
  const supabase = await createClient();

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

// 재고 부족 재료 (임계치 이하)
export async function getLowStockIngredients(threshold: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .lt('current_stock', threshold)
    .order('current_stock', { ascending: true });

  if (error) {
    console.error('getLowStockIngredients error:', error);
    return [];
  }

  return data || [];
}

// 3. 레시피/메뉴 분석 - 메뉴 목록과 원가 정보
export async function getMenuAnalysis() {
  const supabase = await createClient();

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
  const supabase = await createClient();

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
export async function getStockMovements(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('stock_movements')
    .select('*, ingredients(ingredient_name)')
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

  return data || [];
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
      case 'incoming':
      case 'in':
        summary.incoming += m.quantity || 0;
        break;
      case 'outgoing':
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

// ========== Settings 페이지용 함수들 ==========

import type {
  BusinessSettings,
  InventorySettings,
  RecipeSettings,
  ReportSettings,
  NotificationSettings,
  SystemSettings,
  UserPermission,
} from '@/types';

// 비즈니스 설정
export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { error } = await supabase.from('work_records').delete().eq('id', id);

  if (error) {
    console.error('deleteWorkRecord error:', error);
    return false;
  }
  return true;
}

// 급여 내역 조회
export async function getPayrolls(year: number, month?: number) {
  const supabase = await createClient();

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
  const supabase = await createClient();

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
  const supabase = await createClient();
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
