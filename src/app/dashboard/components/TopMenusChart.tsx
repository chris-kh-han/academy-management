import TopMenusChartClient from './TopMenusChartClient';

type TopMenu = {
  menu_id: number;
  menu_name: string;
  category: string;
  total_sales: number;
  sales_count: number;
};

type Props = {
  topMenus7: TopMenu[];
  topMenus30: TopMenu[];
};

export default function TopMenusChart({ topMenus7, topMenus30 }: Props) {
  return <TopMenusChartClient topMenus7={topMenus7} topMenus30={topMenus30} />;
}
