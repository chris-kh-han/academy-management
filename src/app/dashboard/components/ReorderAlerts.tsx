import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight, ShoppingCart } from 'lucide-react';
import { getAllIngredients } from '@/utils/supabase/supabase';

export default async function ReorderAlerts() {
  const ingredients = await getAllIngredients();

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
      return { label: '품절', className: 'bg-red-100 text-red-700 border-red-200' };
    }
    return { label: '저재고', className: 'bg-orange-100 text-orange-700 border-orange-200' };
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
              const status = getStatus(item.current_qty ?? 0, item.reorder_point);
              return (
                <div
                  key={item.id}
                  className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium truncate'>
                        {item.ingredient_name}
                      </p>
                      <Badge variant='outline' className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground mt-0.5'>
                      현재: {item.current_qty ?? 0} {item.unit}
                      {item.reorder_point && (
                        <span className='ml-2'>
                          / 재주문점: {item.reorder_point} {item.unit}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link href='/orders'>
                    <Button size='sm' variant='outline' className='cursor-pointer shrink-0 ml-2'>
                      <ShoppingCart className='h-3 w-3 mr-1' />
                      발주
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
            <div className='rounded-full bg-green-100 p-3 mb-3'>
              <AlertTriangle className='h-5 w-5 text-green-600' />
            </div>
            <p className='text-sm'>모든 재고가 충분합니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
