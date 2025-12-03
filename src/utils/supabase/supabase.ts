import { createClient } from '@/utils/supabase/server';
import type { Sale } from '@/types';

export async function getSales() {
  const supabase = await createClient();
  const { data: sales } = await supabase
    .from('menu_sales')
    .select('*, menus(menu_name)');
  return sales;
}

export async function getSalesByPeriods() {
  const supabase = await createClient();

  // 1. 각 기간별 전체 row를 가져옴 (limit 없이)
  const [dayRows, weekRows, monthRows] = await Promise.all([
    supabase
      .from('menu_sales')
      .select('*, menus(menu_name)')
      .eq('sold_at', '2025-10-16'),
    supabase
      .from('menu_sales')
      .select('*, menus(menu_name)')
      .gte('sold_at', '2025-10-10')
      .lte('sold_at', '2025-10-16'),
    supabase
      .from('menu_sales')
      .select('*, menus(menu_name)')
      .gte('sold_at', '2025-09-15')
      .lte('sold_at', '2025-10-16'),
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

    return merged.sort((a, b) => b.total_sales - a.total_sales).slice(0, 3);
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
    const menuName =
      Array.isArray(row.menus)
        ? row.menus[0]?.menu_name
        : row.menus?.menu_name || 'Unknown';
    const category =
      Array.isArray(row.menus)
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
    const menuName =
      Array.isArray(row.menus)
        ? row.menus[0]?.menu_name
        : row.menus?.menu_name || 'Unknown';
    const category =
      Array.isArray(row.menus)
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
