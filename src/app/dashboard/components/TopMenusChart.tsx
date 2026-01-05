import { getTopSellingMenus } from '@/utils/supabase/supabase';
import TopMenusChartClient from './TopMenusChartClient';

export default async function TopMenusChart() {
  const [topMenus7, topMenus30] = await Promise.all([
    getTopSellingMenus(5, 7),
    getTopSellingMenus(5, 30),
  ]);

  return (
    <TopMenusChartClient
      topMenus7={topMenus7}
      topMenus30={topMenus30}
    />
  );
}
