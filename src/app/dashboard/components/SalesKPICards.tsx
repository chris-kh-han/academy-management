import { AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getDashboardSalesSummary,
  getLowStockIngredients,
} from '@/utils/supabase/supabase';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change >= 0;
  return (
    <div
      className={`flex items-center gap-1 text-sm ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className='h-4 w-4' />
      ) : (
        <ArrowDownRight className='h-4 w-4' />
      )}
      <span>{Math.abs(change)}%</span>
    </div>
  );
}

export default async function SalesKPICards() {
  const [salesSummary, lowStockItems] = await Promise.all([
    getDashboardSalesSummary(),
    getLowStockIngredients(10),
  ]);

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardDescription>어제 매출</CardDescription>
          <CardTitle className='text-2xl'>
            {formatCurrency(salesSummary.yesterday.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangeIndicator change={salesSummary.yesterday.change} />
          <p className='text-xs text-muted-foreground'>전일 대비</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardDescription>주간 매출</CardDescription>
          <CardTitle className='text-2xl'>
            {formatCurrency(salesSummary.week.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangeIndicator change={salesSummary.week.change} />
          <p className='text-xs text-muted-foreground'>전주 대비</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardDescription>월간 매출</CardDescription>
          <CardTitle className='text-2xl'>
            {formatCurrency(salesSummary.month.total)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangeIndicator change={salesSummary.month.change} />
          <p className='text-xs text-muted-foreground'>전월 대비</p>
        </CardContent>
      </Card>

      <Card className={lowStockItems && lowStockItems.length > 0 ? 'border-orange-300' : ''}>
        <CardHeader className='pb-2'>
          <CardDescription className='flex items-center gap-2'>
            {lowStockItems && lowStockItems.length > 0 && (
              <AlertTriangle className='h-4 w-4 text-orange-500' />
            )}
            재고 부족
          </CardDescription>
          <CardTitle className='text-2xl'>{lowStockItems?.length ?? 0}개</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-xs text-muted-foreground'>임계치 이하 재료</p>
        </CardContent>
      </Card>
    </div>
  );
}
