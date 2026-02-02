'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

type Ingredient = {
  id: string;
  ingredient_name: string;
  unit: string;
  priority?: number;
  storage_location?: string | null;
  packs_per_box?: number | null;
  units_per_pack?: number | null;
  current_qty?: number;
};

type ClosingItemRowProps = {
  ingredient: Ingredient;
  values: {
    boxes: number;
    packs: number;
    units: number;
  };
  onChange: (ingredientId: string, field: 'boxes' | 'packs' | 'units', value: number) => void;
  isCompleted: boolean;
};

// 우선순위 뱃지
function getPriorityBadge(priority: number | undefined) {
  switch (priority) {
    case 1:
      return { label: '1', className: 'bg-red-500 text-white' };
    case 2:
      return { label: '2', className: 'bg-yellow-500 text-white' };
    case 3:
      return { label: '3', className: 'bg-gray-400 text-white' };
    default:
      return { label: '-', className: 'bg-gray-200 text-gray-500' };
  }
}

export function ClosingItemRow({
  ingredient,
  values,
  onChange,
  isCompleted,
}: ClosingItemRowProps) {
  const priorityBadge = getPriorityBadge(ingredient.priority);
  const hasPackaging =
    (ingredient.packs_per_box && ingredient.packs_per_box > 1) ||
    (ingredient.units_per_pack && ingredient.units_per_pack > 1);

  // 총 수량 계산
  const packsPerBox = ingredient.packs_per_box || 1;
  const unitsPerPack = ingredient.units_per_pack || 1;
  const totalQty =
    values.boxes * packsPerBox * unitsPerPack +
    values.packs * unitsPerPack +
    values.units;

  // 입력 값이 있으면 완료 처리
  const hasValue = values.boxes > 0 || values.packs > 0 || values.units > 0;

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 border-b last:border-b-0 ${
        hasValue ? 'bg-green-50' : ''
      }`}
    >
      {/* 우선순위 뱃지 */}
      <span
        className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${priorityBadge.className}`}
      >
        {priorityBadge.label}
      </span>

      {/* 품목명 */}
      <div className='flex-1 min-w-0'>
        <span className='font-medium text-sm truncate block'>
          {ingredient.ingredient_name}
        </span>
        {hasPackaging && (
          <span className='text-xs text-muted-foreground'>
            ({packsPerBox}팩/박스, {unitsPerPack}개/팩)
          </span>
        )}
      </div>

      {/* 입력 필드 */}
      <div className='flex items-center gap-1'>
        {/* 박스 */}
        <div className='flex flex-col items-center'>
          <Input
            type='number'
            inputMode='numeric'
            min='0'
            value={values.boxes || ''}
            onChange={(e) =>
              onChange(ingredient.id, 'boxes', Number(e.target.value) || 0)
            }
            disabled={isCompleted}
            className='w-14 h-8 text-center text-sm'
            placeholder='0'
          />
          <span className='text-[10px] text-muted-foreground'>박스</span>
        </div>

        {/* 팩 (포장 단위가 있을 때만) */}
        {hasPackaging && (
          <div className='flex flex-col items-center'>
            <Input
              type='number'
              inputMode='numeric'
              min='0'
              value={values.packs || ''}
              onChange={(e) =>
                onChange(ingredient.id, 'packs', Number(e.target.value) || 0)
              }
              disabled={isCompleted}
              className='w-14 h-8 text-center text-sm'
              placeholder='0'
            />
            <span className='text-[10px] text-muted-foreground'>팩</span>
          </div>
        )}

        {/* 낱개 */}
        <div className='flex flex-col items-center'>
          <Input
            type='number'
            inputMode='numeric'
            min='0'
            value={values.units || ''}
            onChange={(e) =>
              onChange(ingredient.id, 'units', Number(e.target.value) || 0)
            }
            disabled={isCompleted}
            className='w-14 h-8 text-center text-sm'
            placeholder='0'
          />
          <span className='text-[10px] text-muted-foreground'>
            {ingredient.unit || '개'}
          </span>
        </div>
      </div>

      {/* 총 수량 표시 */}
      <div className='w-16 text-right'>
        <span className='text-sm font-medium tabular-nums'>
          {totalQty} {ingredient.unit || '개'}
        </span>
      </div>

      {/* 완료 체크 */}
      {hasValue && (
        <Check className='w-5 h-5 text-green-600 flex-shrink-0' />
      )}
    </div>
  );
}
