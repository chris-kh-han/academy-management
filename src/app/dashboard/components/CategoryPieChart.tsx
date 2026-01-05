import { getSalesByCategory } from '@/utils/supabase/supabase';
import CategoryPieChartClient from './CategoryPieChartClient';

export default async function CategoryPieChart() {
  const [category7, category30] = await Promise.all([
    getSalesByCategory(7),
    getSalesByCategory(30),
  ]);

  return (
    <CategoryPieChartClient
      category7={category7}
      category30={category30}
    />
  );
}
