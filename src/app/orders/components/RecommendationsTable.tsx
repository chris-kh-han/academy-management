'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';

type Recommendation = {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  current_qty: number;
  reorder_point: number;
  recommended_qty: number;
  supplier?: string;
};

type RecommendationsTableProps = {
  recommendations: Recommendation[];
  onCreateOrder: () => void;
};

export function RecommendationsTable({
  recommendations,
  onCreateOrder,
}: RecommendationsTableProps) {
  const getStatus = (currentQty: number, reorderPoint: number) => {
    if (currentQty <= 0) {
      return { label: '품절', className: 'bg-red-100 text-red-700' };
    }
    if (currentQty < reorderPoint * 0.5) {
      return { label: '긴급', className: 'bg-orange-100 text-orange-700' };
    }
    return { label: '저재고', className: 'bg-yellow-100 text-yellow-700' };
  };

  return (
    <div className='space-y-4'>
      {recommendations.length > 0 && (
        <div className='flex justify-end'>
          <Button onClick={onCreateOrder}>
            <ShoppingCart className='mr-2 h-4 w-4' />
            전체 발주하기 ({recommendations.length}건)
          </Button>
        </div>
      )}

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상태</TableHead>
              <TableHead>품목명</TableHead>
              <TableHead className='text-right'>현재 재고</TableHead>
              <TableHead className='text-right'>재주문점</TableHead>
              <TableHead className='text-right'>권장 발주량</TableHead>
              <TableHead>공급처</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.length > 0 ? (
              recommendations.map((rec) => {
                const status = getStatus(rec.current_qty, rec.reorder_point);
                return (
                  <TableRow key={rec.ingredient_id}>
                    <TableCell>
                      <Badge variant='outline' className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className='font-medium'>
                      {rec.ingredient_name}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      <span
                        className={
                          rec.current_qty <= 0 ? 'text-red-600 font-bold' : ''
                        }
                      >
                        {rec.current_qty}
                      </span>{' '}
                      {rec.unit}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {rec.reorder_point} {rec.unit}
                    </TableCell>
                    <TableCell className='text-right tabular-nums font-medium text-blue-600'>
                      {rec.recommended_qty} {rec.unit}
                    </TableCell>
                    <TableCell>{rec.supplier || '-'}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='h-24 text-center text-muted-foreground'
                >
                  <div className='flex flex-col items-center gap-2'>
                    <div className='rounded-full bg-green-100 p-3'>
                      <ShoppingCart className='h-5 w-5 text-green-600' />
                    </div>
                    <p>발주가 필요한 품목이 없습니다.</p>
                    <p className='text-sm'>모든 재고가 충분합니다.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
