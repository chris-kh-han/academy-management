import { ArrowDownCircle, ArrowUpCircle, Package, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getRecentStockMovements } from '@/utils/supabase/supabase';

function getMovementInfo(type: string) {
  if (type === 'in' || type === 'incoming') {
    return {
      label: '입고',
      icon: ArrowDownCircle,
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-500',
    };
  }
  if (type === 'out' || type === 'outgoing') {
    return {
      label: '출고',
      icon: ArrowUpCircle,
      style: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-500',
    };
  }
  return {
    label: '폐기',
    icon: Trash2,
    style: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
  };
}

export default async function RecentMovements() {
  const movements = await getRecentStockMovements(5);

  return (
    <Card className='liquid-glass liquid-glass-hover rounded-2xl'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          <div className='rounded-lg bg-slate-100 p-1.5'>
            <Package className='h-4 w-4 text-slate-600' />
          </div>
          최근 입출고 내역
        </CardTitle>
        <CardDescription className='text-xs'>최근 5건</CardDescription>
      </CardHeader>
      <CardContent className='pt-2'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-100'>
                <th className='text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider'>품목명</th>
                <th className='text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider'>유형</th>
                <th className='text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider'>수량</th>
                <th className='text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider'>일시</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50'>
              {!movements || movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className='text-center py-10'
                  >
                    <div className='flex flex-col items-center'>
                      <div className='rounded-full bg-slate-50 p-3 mb-3'>
                        <Package className='h-6 w-6 text-slate-400' />
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        최근 입출고 내역이 없습니다
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const info = getMovementInfo(movement.movement_type);
                  const Icon = info.icon;
                  return (
                    <tr key={movement.id} className='hover:bg-slate-50/50 transition-colors'>
                      <td className='py-3 px-4'>
                        <span className='font-medium text-sm'>{movement.ingredient_name}</span>
                      </td>
                      <td className='py-3 px-4'>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${info.style}`}
                        >
                          <Icon className={`h-3 w-3 ${info.iconColor}`} />
                          {info.label}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        <span className='font-medium text-sm'>{movement.quantity}</span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        <span className='text-xs text-muted-foreground'>
                          {new Date(movement.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
