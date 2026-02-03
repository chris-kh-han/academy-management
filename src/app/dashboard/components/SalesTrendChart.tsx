import SalesTrendChartClient from './SalesTrendChartClient';

type DailyTrend = {
  date: string;
  total: number;
  count: number;
};

type Props = {
  trend7: DailyTrend[];
  trend30: DailyTrend[];
};

export default function SalesTrendChart({ trend7, trend30 }: Props) {
  return <SalesTrendChartClient trend7={trend7} trend30={trend30} />;
}
