import { getDailySalesTrend } from '@/utils/supabase/supabase';
import SalesTrendChartClient from './SalesTrendChartClient';

export default async function SalesTrendChart() {
  const [trend7, trend30] = await Promise.all([
    getDailySalesTrend(7),
    getDailySalesTrend(30),
  ]);

  return (
    <SalesTrendChartClient
      trend7={trend7}
      trend30={trend30}
    />
  );
}
