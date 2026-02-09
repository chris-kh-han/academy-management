import { memo } from 'react';
import Link from 'next/link';
import {
  FileText,
  ClipboardList,
  BadgeCheck,
  AlertOctagon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

type InvoiceStats = {
  todayReceived: number;
  pendingInspection: number;
  monthConfirmedAmount: number;
  unmatchedItems: number;
};

type Props = {
  stats: InvoiceStats;
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

export default function InvoiceKPICards({ stats }: Props) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <KPICard
        icon={<FileText className='h-5 w-5' />}
        label='오늘 수신 명세서'
        value={`${stats.todayReceived}건`}
        subtext='오늘 접수된 명세서'
        href='/invoices'
      />
      <KPICard
        icon={<ClipboardList className='h-5 w-5' />}
        label='검수 대기'
        value={`${stats.pendingInspection}건`}
        subtext='확인이 필요한 명세서'
        variant={stats.pendingInspection > 0 ? 'warning' : 'default'}
        href='/invoices'
      />
      <KPICard
        icon={<BadgeCheck className='h-5 w-5' />}
        label='이번달 확인 금액'
        value={formatCurrency(stats.monthConfirmedAmount)}
        subtext='이번 달 확정된 총액'
        href='/invoices'
      />
      <KPICard
        icon={<AlertOctagon className='h-5 w-5' />}
        label='미매칭 품목'
        value={`${stats.unmatchedItems}개`}
        subtext='재료 매칭 필요'
        variant={stats.unmatchedItems > 0 ? 'danger' : 'default'}
        href='/invoices'
      />
    </div>
  );
}
