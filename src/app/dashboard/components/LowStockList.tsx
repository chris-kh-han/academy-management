import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getLowStockIngredients } from '@/utils/supabase/supabase';

export default async function LowStockList() {
  const lowStockItems = await getLowStockIngredients(10);
  const hasLowStock = lowStockItems && lowStockItems.length > 0;

  return (
    <Card className='liquid-glass liquid-glass-hover rounded-2xl'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <div className={`rounded-lg p-1.5 ${hasLowStock ? 'bg-red-100' : 'bg-emerald-100'}`}>
            {hasLowStock ? (
              <AlertTriangle className='h-4 w-4 text-red-600' />
            ) : (
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
            )}
          </div>
          재고 부족 재료
        </CardTitle>
        <CardDescription className='text-xs'>임계치 10 이하 재료</CardDescription>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='space-y-2 max-h-[280px] overflow-y-auto'>
          {!hasLowStock ? (
            <div className='flex flex-col items-center justify-center py-10 text-center'>
              <div className='rounded-full bg-emerald-50 p-3 mb-3'>
                <CheckCircle2 className='h-6 w-6 text-emerald-500' />
              </div>
              <p className='text-sm text-muted-foreground'>
                부족한 재료가 없습니다
              </p>
            </div>
          ) : (
            lowStockItems.map((item, index) => (
              <div
                key={item.ingredient_id}
                className='flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-100'
              >
                <div className='flex items-center gap-3'>
                  <span className='flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold'>
                    {index + 1}
                  </span>
                  <span className='font-medium text-sm'>{item.ingredient_name}</span>
                </div>
                <span className='text-red-600 font-bold text-sm'>
                  {item.current_qty ?? 0} {item.unit}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
