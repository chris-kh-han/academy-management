'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

type IngredientOption = {
  id: string;
  ingredient_name: string;
  unit: string;
};

export type ScanItem = {
  id: string;
  name: string;
  ingredient_id: string;
  box: string;
  ea: string;
  quantity: string;
  unit: string;
  unit_price: string;
  total_price: string;
  note: string;
};

type OCRResultTableProps = {
  items: ScanItem[];
  ingredients: IngredientOption[];
  onUpdate: (id: string, field: keyof ScanItem, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

const formatNumberWithComma = (value: string): string => {
  if (!value) return '';
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  return num.toLocaleString('ko-KR');
};

const parseNumberValue = (value: string): string => {
  return value.replace(/,/g, '');
};

export function OCRResultTable({
  items,
  ingredients,
  onUpdate,
  onAdd,
  onRemove,
}: OCRResultTableProps) {
  const totalAmount = React.useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = item.total_price
          ? Number(item.total_price)
          : item.quantity && item.unit_price
            ? Number(item.quantity) * Number(item.unit_price)
            : 0;
        return sum + price;
      }, 0),
    [items],
  );

  if (items.length === 0) {
    return (
      <div className='text-muted-foreground flex h-48 items-center justify-center rounded-md border'>
        <div className='flex flex-col items-center gap-2'>
          <p className='text-sm'>
            이미지를 업로드하고 스캔하면 품목이 표시됩니다.
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={onAdd}
            className='cursor-pointer'
          >
            <Plus className='mr-1 h-3.5 w-3.5' />
            수동으로 항목 추가
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>
          추출된 품목 ({items.length}건)
        </h3>
        <Button
          variant='outline'
          size='sm'
          onClick={onAdd}
          className='h-8 cursor-pointer gap-1.5 px-3 text-xs'
        >
          <Plus className='h-3.5 w-3.5' />행 추가
        </Button>
      </div>

      <div className='overflow-hidden rounded-md border bg-white dark:bg-gray-950'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-8'>#</TableHead>
                <TableHead className='min-w-[120px]'>품명</TableHead>
                <TableHead className='min-w-[160px]'>재료 매칭</TableHead>
                <TableHead className='w-20'>BOX</TableHead>
                <TableHead className='w-20'>EA</TableHead>
                <TableHead className='w-20'>수량</TableHead>
                <TableHead className='w-24'>단가</TableHead>
                <TableHead className='w-28'>금액</TableHead>
                <TableHead className='w-24'>비고</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow
                  key={item.id}
                  className='hover:bg-muted/40 transition-colors'
                >
                  <TableCell className='text-muted-foreground text-xs'>
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder='품명'
                      value={item.name}
                      onChange={(e) =>
                        onUpdate(item.id, 'name', e.target.value)
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.ingredient_id || 'unmatched'}
                      onValueChange={(value) =>
                        onUpdate(
                          item.id,
                          'ingredient_id',
                          value === 'unmatched' ? '' : value,
                        )
                      }
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='선택' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='unmatched'>신규 등록</SelectItem>
                        {ingredients.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.ingredient_name} ({ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!item.ingredient_id && item.name && (
                      <p className='mt-0.5 px-1 text-[10px] text-amber-600 dark:text-amber-400'>
                        신규 등록 예정
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type='text'
                      inputMode='numeric'
                      placeholder='-'
                      value={formatNumberWithComma(item.box)}
                      onChange={(e) =>
                        onUpdate(
                          item.id,
                          'box',
                          parseNumberValue(e.target.value),
                        )
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='text'
                      inputMode='numeric'
                      placeholder='-'
                      value={formatNumberWithComma(item.ea)}
                      onChange={(e) =>
                        onUpdate(
                          item.id,
                          'ea',
                          parseNumberValue(e.target.value),
                        )
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='text'
                      inputMode='decimal'
                      placeholder='0'
                      value={formatNumberWithComma(item.quantity)}
                      onChange={(e) =>
                        onUpdate(
                          item.id,
                          'quantity',
                          parseNumberValue(e.target.value),
                        )
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='text'
                      inputMode='decimal'
                      placeholder='0'
                      value={formatNumberWithComma(item.unit_price)}
                      onChange={(e) =>
                        onUpdate(
                          item.id,
                          'unit_price',
                          parseNumberValue(e.target.value),
                        )
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='text'
                      inputMode='decimal'
                      placeholder='0'
                      value={formatNumberWithComma(item.total_price)}
                      onChange={(e) =>
                        onUpdate(
                          item.id,
                          'total_price',
                          parseNumberValue(e.target.value),
                        )
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder='-'
                      value={item.note}
                      onChange={(e) =>
                        onUpdate(item.id, 'note', e.target.value)
                      }
                      className='h-8 text-xs'
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label={`${item.name || `${index + 1}번`} 항목 삭제`}
                      className='text-muted-foreground hover:text-destructive h-8 w-8'
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className='text-right font-medium'>
                  합계
                </TableCell>
                <TableCell className='font-bold'>
                  {totalAmount.toLocaleString('ko-KR')}원
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
