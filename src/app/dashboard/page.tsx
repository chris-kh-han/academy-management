import { createClient } from '@/utils/supabase/server';
import DashboardContent from './components/DashboardContent';
import { getSales, getSalesByPeriods } from '@/utils/supabase/supabase';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
export const revalidate = 0; // 항상 최신 데이터(fetch cache: 'no-store'와 동일)

export default async function DashboardPage() {
  // Protect this route on the server: if there's no signed-in user, redirect to sign-in
  const user = await currentUser();

  console.log(user);
  if (!user) {
    // return redirect('/sign-in');
  }

  const supabase = await createClient();

  // 어제 날짜 MM-DD-YYYY 포맷
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const mm = String(y.getMonth() + 1).padStart(2, '0');
  const dd = String(y.getDate()).padStart(2, '0');
  const yyyy = y.getFullYear();
  const yesterday = `${2025}-${10}-${15}`;

  // console.log(yesterday);

  // menu_sales에서 menus를 join해서 어제 매출 Top 7을 가져옴

  // 타입 정의: Supabase join 결과용
  type Menu = {
    menu_name: string;
  };
  type MenuSalesRow = {
    menu_id: number;
    total_sales: number;
    menus: Menu | Menu[] | null;
  };

  const sales = await getSales();
  const { daySales, weekSales, monthSales } = await getSalesByPeriods();

  console.log(sales);

  // console.log(sales);

  // const { data: dailySales, error } = await supabase
  //   .from('menu_sales')
  //   .select('menu_id, total_sales, sales_count, menus(menu_name)')
  //   .eq('sold_at', yesterday)
  //   .order('total_sales', { ascending: false })
  //   .limit(3);

  // console.log(dailySales);

  // menu_name 평탄화
  // const topSales =
  //   (dailySales as MenuSalesRow[] | null | undefined)?.map((row) => {
  //     let menuName = 'Unknown';
  //     if (Array.isArray(row.menus)) {
  //       menuName = row.menus[0]?.menu_name || 'Unknown';
  //     } else if (row.menus && typeof row.menus === 'object') {
  //       menuName = (row.menus as Menu).menu_name || 'Unknown';
  //     }
  //     return {
  //       menu_name: menuName,
  //       total_sales: row.total_sales || 0,
  //     };
  //   }) ?? [];
  // console.log(topSales, 'topSals');

  // 재료 사용량은 아직 데이터 없으므로 더미 데이터
  const topIngredients = [
    { ingredient_name: '모짜렐라 치즈', total_usage: 85.5 },
    { ingredient_name: '페퍼로니', total_usage: 42.3 },
    { ingredient_name: '토마토 소스', total_usage: 38.7 },
    { ingredient_name: '피자 도우', total_usage: 35.0 },
    { ingredient_name: '양파', total_usage: 28.4 },
    { ingredient_name: '피망', total_usage: 24.8 },
    { ingredient_name: '올리브', total_usage: 18.2 },
  ];

  return (
    <DashboardContent
      sales={sales ?? []}
      daySales={daySales ?? []}
      weekSales={weekSales ?? []}
      monthSales={monthSales ?? []}
      topIngredients={topIngredients}
    />
  );
}
