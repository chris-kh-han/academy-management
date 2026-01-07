import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  Package,
} from 'lucide-react';
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
        isPositive
          ? 'bg-emerald-500/20 text-emerald-700'
          : 'bg-red-500/20 text-red-700'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className='h-3 w-3' />
      ) : (
        <ArrowDownRight className='h-3 w-3' />
      )}
      <span>{Math.abs(change)}%</span>
    </div>
  );
}

type KPICardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  subtext: string;
  variant?: 'default' | 'warning';
};

function KPICard({
  icon,
  label,
  value,
  change,
  subtext,
  variant = 'default',
}: KPICardProps) {
  const isWarning = variant === 'warning';

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5
        backdrop-blur-xl backdrop-saturate-150
        border border-white/50
        ${isWarning ? 'bg-orange-50/70' : 'bg-white/70'}
        shadow-[0_8px_32px_rgba(0,0,0,0.06)]
        transition-all duration-300 ease-out
        hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]
        hover:translate-y-[-2px]
        hover:bg-white/80
      `}
    >
      <div className='relative z-10 flex items-start justify-between'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-slate-500'>{label}</p>
          <p className='text-2xl font-bold tracking-tight text-slate-800'>
            {value}
          </p>
          <div className='flex items-center gap-2 pt-1'>
            {change !== undefined && <ChangeIndicator change={change} />}
            <span className='text-xs text-slate-600'>{subtext}</span>
          </div>
        </div>
        <div
          className={`
            rounded-xl p-2.5 backdrop-blur-sm
            ${
              isWarning
                ? 'bg-orange-500/20 text-orange-600 shadow-orange-200/50'
                : 'bg-primary/15 text-primary shadow-primary/10'
            }
            shadow-[0_4px_12px_rgba(0,0,0,0.05)]
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function SalesKPICards() {
  const [salesSummary, lowStockItems] = await Promise.all([
    getDashboardSalesSummary(),
    getLowStockIngredients(10),
  ]);

  const hasLowStock = lowStockItems && lowStockItems.length > 0;

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <KPICard
        icon={<Calendar className='h-5 w-5' />}
        label='어제 매출'
        value={formatCurrency(salesSummary.yesterday.total)}
        change={salesSummary.yesterday.change}
        subtext='전일 대비'
      />
      <KPICard
        icon={<CalendarDays className='h-5 w-5' />}
        label='주간 매출'
        value={formatCurrency(salesSummary.week.total)}
        change={salesSummary.week.change}
        subtext='전주 대비'
      />
      <KPICard
        icon={<CalendarRange className='h-5 w-5' />}
        label='월간 매출'
        value={formatCurrency(salesSummary.month.total)}
        change={salesSummary.month.change}
        subtext='전월 대비'
      />
      <KPICard
        icon={
          hasLowStock ? (
            <AlertTriangle className='h-5 w-5' />
          ) : (
            <Package className='h-5 w-5' />
          )
        }
        label='재고 부족'
        value={`${lowStockItems?.length ?? 0}개`}
        subtext='임계치 이하 재료'
        variant={hasLowStock ? 'warning' : 'default'}
      />
    </div>
  );
}
