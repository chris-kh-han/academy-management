import { createClient } from '@/utils/supabase/server';
import type { Sale } from '@/types';
const supabase = await createClient();

export async function getSales() {
  const { data: sales } = await supabase
    .from('menu_sales')
    .select('*, menus(menu_name)');
  return sales;
}

export async function getSalesByPeriods() {
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
    // console.log(merged);

    merged.forEach((item: Sale) => {
      delete item.menus;
    });

    // console.log(merged);
    return merged.sort((a, b) => b.total_sales - a.total_sales).slice(0, 3);
  }

  return {
    daySales: groupAndTop3(dayRows.data),
    weekSales: groupAndTop3(weekRows.data),
    monthSales: groupAndTop3(monthRows.data),
  };
}
