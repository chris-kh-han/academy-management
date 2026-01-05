import { Package } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getRecentStockMovements } from '@/utils/supabase/supabase';

function getMovementLabel(type: string) {
  if (type === 'in' || type === 'incoming') return '입고';
  if (type === 'out' || type === 'outgoing') return '출고';
  return '폐기';
}

function getMovementStyle(type: string) {
  if (type === 'in' || type === 'incoming') {
    return 'bg-green-100 text-green-700';
  }
  if (type === 'out' || type === 'outgoing') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-red-100 text-red-700';
}

export default async function RecentMovements() {
  const movements = await getRecentStockMovements(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='h-5 w-5' />
          최근 입출고 내역
        </CardTitle>
        <CardDescription>최근 5건</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b'>
                <th className='text-left py-2 px-4'>재료명</th>
                <th className='text-left py-2 px-4'>유형</th>
                <th className='text-right py-2 px-4'>수량</th>
                <th className='text-right py-2 px-4'>일시</th>
              </tr>
            </thead>
            <tbody>
              {!movements || movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className='text-center py-8 text-muted-foreground'
                  >
                    최근 입출고 내역이 없습니다
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className='border-b last:border-0'>
                    <td className='py-3 px-4'>{movement.ingredient_name}</td>
                    <td className='py-3 px-4'>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getMovementStyle(
                          movement.movement_type
                        )}`}
                      >
                        {getMovementLabel(movement.movement_type)}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right'>{movement.quantity}</td>
                    <td className='py-3 px-4 text-right text-muted-foreground'>
                      {new Date(movement.created_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
