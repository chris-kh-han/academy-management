'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Search } from 'lucide-react';
import type { DailyClosingItem } from '@/types';

type Ingredient = {
  id: string;
  ingredient_name: string;
  category: string;
  unit: string;
  current_qty: number;
  target_stock: number;
};

type Props = {
  closingId: string;
  ingredients: Ingredient[];
  closingItems: DailyClosingItem[];
  onSaveItem: (item: {
    ingredient_id: string;
    opening_qty: number;
    used_qty: number;
    waste_qty?: number;
  }) => Promise<void>;
};

export default function ClosingForm({
  closingId,
  ingredients,
  closingItems,
  onSaveItem,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [localInputs, setLocalInputs] = useState<Record<string, number>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // 카테고리 목록
  const categories = useMemo(() => {
    const cats = [...new Set(ingredients.map((i) => i.category).filter(Boolean))];
    return cats.sort();
  }, [ingredients]);

  // 아이템별 기존 입력값 매핑
  const itemMap = useMemo(() => {
    const map: Record<string, DailyClosingItem> = {};
    closingItems.forEach((item) => {
      map[item.ingredient_id] = item;
    });
    return map;
  }, [closingItems]);

  // 필터링된 재료 목록
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch =
        !searchQuery ||
        ing.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || ing.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchQuery, categoryFilter]);

  // 입력값 변경
  const handleInputChange = (ingredientId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalInputs((prev) => ({
      ...prev,
      [ingredientId]: numValue,
    }));
  };

  // 저장
  const handleSave = async (ingredient: Ingredient) => {
    const usedQty = localInputs[ingredient.id] ?? 0;
    if (usedQty === 0) return;

    setSavingIds((prev) => new Set(prev).add(ingredient.id));

    try {
      await onSaveItem({
        ingredient_id: ingredient.id,
        opening_qty: ingredient.current_qty,
        used_qty: usedQty,
        waste_qty: 0,
      });

      // 입력 필드 초기화 (저장 후 표시는 itemMap에서 처리)
      setLocalInputs((prev) => {
        const next = { ...prev };
        delete next[ingredient.id];
        return next;
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(ingredient.id);
        return next;
      });
    }
  };

  // Enter 키로 저장
  const handleKeyDown = (e: React.KeyboardEvent, ingredient: Ingredient) => {
    if (e.key === 'Enter') {
      handleSave(ingredient);
    }
  };

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="품목명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 재료 목록 */}
      <div className="space-y-2">
        {filteredIngredients.map((ingredient) => {
          const existingItem = itemMap[ingredient.id];
          const localValue = localInputs[ingredient.id];
          const displayUsedQty = localValue ?? existingItem?.used_qty ?? '';
          const closingQty =
            ingredient.current_qty -
            (localValue ?? existingItem?.used_qty ?? 0);
          const isSaving = savingIds.has(ingredient.id);
          const isSaved = !!existingItem && existingItem.used_qty > 0;

          return (
            <Card
              key={ingredient.id}
              className={isSaved ? 'border-green-200 bg-green-50/50' : ''}
            >
              <CardContent className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* 품목 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {ingredient.ingredient_name}
                      </span>
                      {ingredient.category && (
                        <Badge variant="outline" className="text-xs">
                          {ingredient.category}
                        </Badge>
                      )}
                      {isSaved && (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      시작재고: {ingredient.current_qty} {ingredient.unit}
                    </div>
                  </div>

                  {/* 입력 영역 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        사용량:
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={displayUsedQty}
                        onChange={(e) =>
                          handleInputChange(ingredient.id, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, ingredient)}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground">
                        {ingredient.unit}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground mx-2">
                      →
                    </div>

                    <div className="text-sm font-medium min-w-[60px] text-right">
                      {closingQty.toFixed(1)} {ingredient.unit}
                    </div>

                    <Button
                      size="sm"
                      variant={isSaved ? 'outline' : 'default'}
                      onClick={() => handleSave(ingredient)}
                      disabled={isSaving || (localValue ?? 0) === 0}
                      className="w-16"
                    >
                      {isSaving ? '...' : isSaved ? '수정' : '저장'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredIngredients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            조건에 맞는 품목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
