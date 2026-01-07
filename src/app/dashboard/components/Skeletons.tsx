import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

const glassStyle = 'rounded-2xl backdrop-blur-xl backdrop-saturate-150 border border-white/50 bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)]';

export function KPISkeleton() {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`${glassStyle} p-5`}>
          <div className='flex items-start justify-between'>
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-4 w-16 bg-slate-200/60' />
              <Skeleton className='h-7 w-28 bg-slate-200/60' />
              <div className='flex items-center gap-2 pt-1'>
                <Skeleton className='h-5 w-14 rounded-full bg-slate-200/60' />
                <Skeleton className='h-3 w-12 bg-slate-200/60' />
              </div>
            </div>
            <Skeleton className='h-10 w-10 rounded-xl bg-slate-200/60' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card className={glassStyle}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8 rounded-lg bg-slate-200/60' />
            <Skeleton className='h-5 w-28 bg-slate-200/60' />
          </div>
          <Skeleton className='h-7 w-16 rounded-lg bg-slate-200/60' />
        </div>
        <Skeleton className='h-3 w-20 bg-slate-200/60' />
      </CardHeader>
      <CardContent className='pt-2'>
        <Skeleton className='h-[280px] w-full rounded-lg bg-slate-200/60' />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <Card className={glassStyle}>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-8 rounded-lg bg-slate-200/60' />
          <Skeleton className='h-5 w-32 bg-slate-200/60' />
        </div>
        <Skeleton className='h-3 w-16 bg-slate-200/60' />
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='space-y-2'>
          <Skeleton className='h-10 w-full bg-slate-200/60' />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className='h-12 w-full bg-slate-200/60' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ListSkeleton() {
  return (
    <Card className={glassStyle}>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-8 rounded-lg bg-slate-200/60' />
          <Skeleton className='h-5 w-28 bg-slate-200/60' />
        </div>
        <Skeleton className='h-3 w-20 bg-slate-200/60' />
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='space-y-2'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-12 w-full rounded-lg bg-slate-200/60' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
