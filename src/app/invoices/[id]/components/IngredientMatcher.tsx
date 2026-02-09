'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InvoiceItemMatchStatus } from '@/types';

type IngredientOption = {
  id: string;
  ingredient_name: string;
  unit: string;
};

type IngredientMatcherProps = {
  matchStatus: InvoiceItemMatchStatus;
  matchedIngredientId?: string | null;
  ingredients: IngredientOption[];
  onMatch: (ingredientId: string | null) => void;
  disabled?: boolean;
};

const MATCH_STATUS_CONFIG: Record<
  InvoiceItemMatchStatus,
  { label: string; className: string }
> = {
  auto_matched: {
    label: '자동매칭',
    className:
      'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  },
  manual_matched: {
    label: '수동매칭',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  unmatched: {
    label: '매칭 필요',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  },
  new_ingredient: {
    label: '신규 재료',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  },
};

export function IngredientMatcher({
  matchStatus,
  matchedIngredientId,
  ingredients,
  onMatch,
  disabled = false,
}: IngredientMatcherProps) {
  const config = MATCH_STATUS_CONFIG[matchStatus];

  return (
    <div className='flex flex-col gap-1.5'>
      <Badge
        variant='secondary'
        className={cn('w-fit text-xs', config.className)}
      >
        {config.label}
      </Badge>
      <Select
        value={matchedIngredientId ?? 'unmatched'}
        onValueChange={(value) => onMatch(value === 'unmatched' ? null : value)}
        disabled={disabled}
      >
        <SelectTrigger className='h-8 w-full min-w-[160px] text-xs'>
          <SelectValue placeholder='재료 선택...' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='unmatched'>미매칭</SelectItem>
          {ingredients.map((ing) => (
            <SelectItem key={ing.id} value={ing.id}>
              {ing.ingredient_name} ({ing.unit})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
