import { memo } from 'react';
import Link from 'next/link';
import { AlertTriangle, PackageX, ArrowUpDown } from 'lucide-react';
import type { Ingredient, StockMovement } from '@/types';

type MovementsSummary = {
  incoming: number;
  outgoing: number;
  waste: number;
  adjustment: number;
};

type Props = {
  ingredients: Ingredient[] | null;
  movements: StockMovement[];
  summary: MovementsSummary;
};

type KPICardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  variant?: 'default' | 'warning' | 'danger';
  href?: string;
  ariaLabel?: string;
};

const KPICard = memo(function KPICard({
  icon,
  label,
  value,
  subtext,
  variant = 'default',
  href,
  ariaLabel,
}: KPICardProps) {
  const isWarning = variant === 'warning';
  const isDanger = variant === 'danger';

  const content = (
    <div
      role='region'
      aria-label={ariaLabel || `${label}: ${value}`}
      className={`liquid-glass rounded-2xl p-5 transition-all duration-200 ${isWarning ? 'liquid-glass-warning' : ''} ${isDanger ? 'border-red-200 bg-red-50' : ''} ${href ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''} `}
    >
      <div className='relative z-10 flex items-start justify-between'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-slate-500'>{label}</p>
          <p
            className={`text-2xl font-bold tracking-tight ${
              isDanger
                ? 'text-red-600'
                : isWarning
                  ? 'text-orange-600'
                  : 'text-slate-800'
            }`}
          >
            {value}
          </p>
          <span className='text-xs text-slate-600'>{subtext}</span>
        </div>
        <div
          className={`rounded-xl p-2.5 backdrop-blur-sm ${
            isDanger
              ? 'bg-red-500/20 text-red-600'
              : isWarning
                ? 'bg-orange-500/20 text-orange-600'
                : 'bg-primary/15 text-primary'
          } shadow-[0_4px_12px_rgba(0,0,0,0.05)]`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
});

export default function InventoryKPICards({
  ingredients,
  movements,
  summary,
}: Props) {
  // 저재고 품목 (재주문점 이하)
  const lowStockItems = (ingredients ?? []).filter((item) => {
    const reorderPoint = item.reorder_point ?? 0;
    return (
      (item.current_qty ?? 0) < reorderPoint && (item.current_qty ?? 0) > 0
    );
  });

  // 품절 품목
  const outOfStockItems = (ingredients ?? []).filter(
    (item) => (item.current_qty ?? 0) <= 0,
  );

  // 오늘 입출고 건수
  const today = new Date().toISOString().split('T')[0];
  const todayMovements = (movements ?? []).filter((m) =>
    m.created_at?.startsWith(today),
  );

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
      <KPICard
        icon={<AlertTriangle className='h-5 w-5' />}
        label='저재고 품목'
        value={`${lowStockItems.length}개`}
        subtext='발주 필요'
        variant={lowStockItems.length > 0 ? 'warning' : 'default'}
        href='/inventory/forecast'
      />
      <KPICard
        icon={<PackageX className='h-5 w-5' />}
        label='품절 품목'
        value={`${outOfStockItems.length}개`}
        subtext='긴급 발주 필요'
        variant={outOfStockItems.length > 0 ? 'danger' : 'default'}
        href='/orders'
      />
      <KPICard
        icon={<ArrowUpDown className='h-5 w-5' />}
        label='오늘 입출고'
        value={`${todayMovements.length}건`}
        subtext={`입고 ${summary.incoming}건 / 출고 ${summary.outgoing}건`}
        href='/inventory/movements'
      />
    </div>
  );
}
