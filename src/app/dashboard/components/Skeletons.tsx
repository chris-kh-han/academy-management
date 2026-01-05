import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

export function KPISkeleton() {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-8 w-28' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-4 w-12' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton({ title }: { title?: string }) {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          {title ? (
            <Skeleton className='h-6 w-32' />
          ) : (
            <Skeleton className='h-6 w-32' />
          )}
          <Skeleton className='h-8 w-20' />
        </div>
        <Skeleton className='h-4 w-24' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-[300px] w-full' />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='h-4 w-20' />
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-24' />
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-14 w-full' />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
