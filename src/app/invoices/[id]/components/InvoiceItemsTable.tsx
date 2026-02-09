'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { IngredientMatcher } from './IngredientMatcher';
import type { InvoiceItem, InvoiceStatus } from '@/types';

type IngredientOption = {
  id: string;
  ingredient_name: string;
  unit: string;
};

type InvoiceItemsTableProps = {
  items: InvoiceItem[];
  ingredients: IngredientOption[];
  invoiceStatus: InvoiceStatus;
  onMatchChange: (itemId: string, ingredientId: string | null) => void;
  confirmedQtys: Record<string, number>;
  onConfirmedQtyChange: (itemId: string, qty: number) => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);

export function InvoiceItemsTable({
  items,
  ingredients,
  invoiceStatus,
  onMatchChange,
  confirmedQtys,
  onConfirmedQtyChange,
}: InvoiceItemsTableProps) {
  const isEditable =
    invoiceStatus === 'received' || invoiceStatus === 'inspecting';

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
  const confirmedTotal = items.reduce((sum, item) => {
    const confirmedQty = confirmedQtys[item.id] ?? item.quantity;
    return sum + confirmedQty * item.unit_price;
  }, 0);

  return (
    <div className='overflow-hidden rounded-md border bg-white dark:bg-gray-950'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>품목명</TableHead>
            <TableHead className='text-right'>수량</TableHead>
            <TableHead>단위</TableHead>
            <TableHead className='text-right'>단가</TableHead>
            <TableHead className='text-right'>금액</TableHead>
            <TableHead>매칭</TableHead>
            {isEditable && (
              <TableHead className='text-right'>확인수량</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='font-medium'>
                  {item.item_name}
                  {item.note && (
                    <span className='text-muted-foreground ml-1 text-xs'>
                      ({item.note})
                    </span>
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  {item.quantity}
                  {item.box_qty > 0 && (
                    <span className='text-muted-foreground ml-1 text-xs'>
                      ({item.box_qty}박스)
                    </span>
                  )}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {item.unit ?? '-'}
                </TableCell>
                <TableCell className='text-right'>
                  {formatCurrency(item.unit_price)}
                </TableCell>
                <TableCell className='text-right font-medium'>
                  {formatCurrency(item.total_price)}
                </TableCell>
                <TableCell>
                  <IngredientMatcher
                    matchStatus={item.match_status}
                    matchedIngredientId={item.matched_ingredient_id}
                    ingredients={ingredients}
                    onMatch={(ingredientId) =>
                      onMatchChange(item.id, ingredientId)
                    }
                    disabled={!isEditable}
                  />
                </TableCell>
                {isEditable && (
                  <TableCell className='text-right'>
                    <Input
                      type='number'
                      min={0}
                      step='any'
                      value={confirmedQtys[item.id] ?? item.quantity}
                      onChange={(e) =>
                        onConfirmedQtyChange(
                          item.id,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className='ml-auto h-8 w-20 text-right text-sm'
                    />
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={isEditable ? 7 : 6}
                className='text-muted-foreground h-24 text-center'
              >
                품목이 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {items.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className='text-right font-medium'>
                합계
              </TableCell>
              <TableCell className='text-right font-bold'>
                {formatCurrency(totalAmount)}
              </TableCell>
              <TableCell />
              {isEditable && (
                <TableCell className='text-muted-foreground text-right text-xs'>
                  확인: {formatCurrency(confirmedTotal)}
                </TableCell>
              )}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
