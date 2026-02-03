import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight, ShoppingCart } from 'lucide-react';
import type { Ingredient } from '@/types';

type Props = {
  ingredients: Ingredient[] | null;
};

export default function ReorderAlerts({ ingredients }: Props) {
  // 저재고 및 품절 품목 필터링
  const alertItems = (ingredients ?? [])
    .filter((item) => {
      const reorderPoint = item.reorder_point ?? 0;
      const currentQty = item.current_qty ?? 0;
      return currentQty <= reorderPoint;
    })
    .sort((a, b) => (a.current_qty ?? 0) - (b.current_qty ?? 0))
    .slice(0, 5);

  const getStatus = (currentQty: number, reorderPoint: number | null) => {
    if (currentQty <= 0) {
      return {
        label: '품절',
        className: 'bg-red-100 text-red-700 border-red-200',
      };
    }
    return {
      label: '저재고',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    };
  };

  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <AlertTriangle className='h-4 w-4 text-orange-500' />
          발주 필요 품목
        </CardTitle>
        <Link href='/inventory/forecast'>
          <Button variant='ghost' size='sm' className='cursor-pointer text-xs'>
            전체보기
            <ArrowRight className='ml-1 h-3 w-3' />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {alertItems.length > 0 ? (
          <div className='space-y-3'>
            {alertItems.map((item) => {
              const status = getStatus(
                item.current_qty ?? 0,
                item.reorder_point,
              );
              return (
                <div
                  key={item.id}
                  className='bg-muted/50 flex items-center justify-between rounded-lg p-3'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate font-medium'>
                        {item.ingredient_name}
                      </p>
                      <Badge variant='outline' className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground mt-0.5 text-sm'>
                      현재: {item.current_qty ?? 0} {item.unit}
                      {item.reorder_point && (
                        <span className='ml-2'>
                          / 재주문점: {item.reorder_point} {item.unit}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link href='/orders'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='ml-2 shrink-0 cursor-pointer'
                      aria-label={`${item.ingredient_name} 발주하기`}
                    >
                      <ShoppingCart className='mr-1 h-3 w-3' />
                      발주
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : ingredients && ingredients.length > 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
            <div className='mb-3 rounded-full bg-green-100 p-3'>
              <AlertTriangle className='h-5 w-5 text-green-600' />
            </div>
            <p className='text-sm'>모든 재고가 충분합니다</p>
          </div>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
            <p className='text-sm'>등록된 재료가 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
