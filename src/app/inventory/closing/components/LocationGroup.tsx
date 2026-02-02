'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ClosingItemRow } from './ClosingItemRow';

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

type ClosingValues = Record<
  string,
  { boxes: number; packs: number; units: number }
>;

type LocationGroupProps = {
  locationName: string;
  ingredients: Ingredient[];
  values: ClosingValues;
  onChange: (ingredientId: string, field: 'boxes' | 'packs' | 'units', value: number) => void;
  isCompleted: boolean;
};

export function LocationGroup({
  locationName,
  ingredients,
  values,
  onChange,
  isCompleted,
}: LocationGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // 완료된 품목 수 계산
  const completedCount = ingredients.filter((ing) => {
    const v = values[ing.id];
    return v && (v.boxes > 0 || v.packs > 0 || v.units > 0);
  }).length;

  const totalCount = ingredients.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className='border rounded-lg overflow-hidden bg-white'>
      {/* 헤더 */}
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors'
      >
        <div className='flex items-center gap-2'>
          {isExpanded ? (
            <ChevronDown className='w-5 h-5 text-gray-500' />
          ) : (
            <ChevronRight className='w-5 h-5 text-gray-500' />
          )}
          <span className='font-semibold text-gray-800'>{locationName}</span>
        </div>

        <div className='flex items-center gap-3'>
          {/* 진행률 바 */}
          <div className='w-24 h-2 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className={`h-full transition-all duration-300 ${
                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className='text-sm text-gray-600'>
            {completedCount}/{totalCount}
          </span>
        </div>
      </button>

      {/* 품목 목록 */}
      {isExpanded && (
        <div className='divide-y'>
          {ingredients.map((ingredient) => (
            <ClosingItemRow
              key={ingredient.id}
              ingredient={ingredient}
              values={values[ingredient.id] || { boxes: 0, packs: 0, units: 0 }}
              onChange={onChange}
              isCompleted={isCompleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
