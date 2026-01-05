import { AlertTriangle } from 'lucide-react';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-orange-500' />
          재고 부족 재료
        </CardTitle>
        <CardDescription>임계치 10 이하 재료</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3 max-h-[300px] overflow-y-auto'>
          {!lowStockItems || lowStockItems.length === 0 ? (
            <p className='text-muted-foreground text-center py-8'>
              부족한 재료가 없습니다
            </p>
          ) : (
            lowStockItems.map((item) => (
              <div
                key={item.ingredient_id}
                className='flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200'
              >
                <span className='font-medium'>{item.ingredient_name}</span>
                <span className='text-orange-600 font-bold'>
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
