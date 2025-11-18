import type { Sale } from '@/types/index';
import GlassCard from '@/components/GlassCard';

type DashboardCardProps = {
  title: string;
  sales: Sale[];
};

export default function DashboardCard({ title, sales }: DashboardCardProps) {
  return (
    <GlassCard>
      <div className='relative z-10'>
        <h2 className='text-md font-semibold mb-1 text-red-600'>{title}</h2>
        <ul className='space-y-4'>
          {sales.map((item) => (
            <li
              key={item.menu_id}
              className='flex justify-between p-2 bg-white/80 hover:bg-white/50 rounded-lg transition-all duration-300 border border-white/30'
            >
              <span className='font-medium text-fg truncate max-w-[60%]'>
                {item.menu_name}
              </span>

              <div>
                <span className='font-mono text-fg-muted text-sm tabular-nums'>
                  {item.total_sales.toLocaleString()}원
                </span>
                <span className='font-mono text-fg-muted text-sm tabular-nums ml-4'>
                  {item.sales_count}개
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}
