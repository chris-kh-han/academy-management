'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IngredientsTable, Ingredient } from './IngredientsTable';
import { MovementsTable } from './MovementsTable';
import { MovementsSummary } from './MovementsSummary';
import { MovementFormDialog } from './MovementFormDialog';
import { AddIngredientDialog } from './AddIngredientDialog';
import { EditIngredientDialog } from './EditIngredientDialog';
import { IngredientUploadDialog } from './IngredientUploadDialog';
import type { StockMovement, MovementType } from '@/types';

type InventoryContentProps = {
  ingredients: Ingredient[];
  movements: StockMovement[];
  summary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
};

export function InventoryContent({
  ingredients,
  movements,
  summary,
}: InventoryContentProps) {
  const searchParams = useSearchParams();

  // URL에서 초기값 읽기
  const initialTab = searchParams.get('tab') || 'status';
  const initialFilter = searchParams.get('filter') || 'all';

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<MovementType>('in');
  const [dialogIngredientId, setDialogIngredientId] = React.useState<
    string | undefined
  >(undefined);
  const [addIngredientOpen, setAddIngredientOpen] = React.useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [editIngredientOpen, setEditIngredientOpen] = React.useState(false);
  const [editIngredient, setEditIngredient] = React.useState<Ingredient | null>(
    null,
  );
  const [activeTab, setActiveTabState] = React.useState(initialTab);
  const [movementTypeFilter, setMovementTypeFilterState] =
    React.useState(initialFilter);

  // URL 업데이트 (히스토리용)
  const updateUrl = React.useCallback((tab: string, filter: string) => {
    const params = new URLSearchParams();
    if (tab !== 'status') params.set('tab', tab);
    if (filter !== 'all') params.set('filter', filter);
    const queryString = params.toString();
    const newUrl = `/inventory${queryString ? `?${queryString}` : ''}`;
    window.history.pushState({ tab, filter }, '', newUrl);
  }, []);

  // 뒤로가기/앞으로가기 감지
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setActiveTabState(event.state.tab || 'status');
        setMovementTypeFilterState(event.state.filter || 'all');
      } else {
        // URL에서 읽기
        const params = new URLSearchParams(window.location.search);
        setActiveTabState(params.get('tab') || 'status');
        setMovementTypeFilterState(params.get('filter') || 'all');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const filter = tab === 'history' ? movementTypeFilter : 'all';
    updateUrl(tab, filter);
  };

  const setMovementTypeFilter = (filter: string) => {
    setMovementTypeFilterState(filter);
    updateUrl(activeTab, filter);
  };

  const ingredientOptions = ingredients.map((i) => ({
    id: i.id,
    name: i.ingredient_name,
    unit: i.unit,
    current_qty: i.current_qty,
  }));

  // 기존 재료들의 카테고리 추출 (중복 제거, 빈값 제외)
  const existingCategories = React.useMemo(() => {
    const categories = ingredients
      .map((i) => i.category)
      .filter((c): c is string => !!c && c.trim() !== '');
    return [...new Set(categories)].sort();
  }, [ingredients]);

  const handleOpenMovementDialog = (
    type: MovementType,
    ingredientId?: string,
  ) => {
    setDialogType(type);
    setDialogIngredientId(ingredientId);
    setDialogOpen(true);
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditIngredient(ingredient);
    setEditIngredientOpen(true);
  };

  const handleSummaryCardClick = (type: MovementType) => {
    setActiveTabState('history');
    setMovementTypeFilterState(type);
    updateUrl('history', type);
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>재고 관리</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            재료 재고 현황을 확인하고 입출고를 관리합니다.
          </p>
        </div>
        <div className='flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:w-auto'>
          <Button
            variant='outline'
            className='w-full sm:w-[140px] py-3 sm:py-2 cursor-pointer'
            onClick={() => setAddIngredientOpen(true)}
          >
            <Plus className='mr-2 h-4 w-4' />
            재료 추가
          </Button>
          <Button
            variant='outline'
            className='w-full sm:w-[140px] py-3 sm:py-2 cursor-pointer'
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className='mr-2 h-4 w-4' />
            일괄 업로드
          </Button>
          <Button
            className='w-full sm:w-[160px] py-3 sm:py-2 cursor-pointer'
            onClick={() => handleOpenMovementDialog('in')}
          >
            <Plus className='mr-2 h-4 w-4' />
            재고 이동 등록
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList>
          <TabsTrigger value='status'>현황</TabsTrigger>
          <TabsTrigger value='history'>입출고 이력</TabsTrigger>
        </TabsList>
        <TabsContent value='status' className='space-y-6'>
          <MovementsSummary
            summary={summary}
            onCardClick={handleSummaryCardClick}
          />
          <IngredientsTable
            data={ingredients}
            onMovement={handleOpenMovementDialog}
            onEdit={handleEditIngredient}
          />
        </TabsContent>

        {/* 입출고 이력 */}
        <TabsContent value='history'>
          <MovementsTable
            data={movements}
            typeFilter={movementTypeFilter}
            onTypeFilterChange={setMovementTypeFilter}
          />
        </TabsContent>
      </Tabs>

      <MovementFormDialog
        ingredients={ingredientOptions}
        defaultType={dialogType}
        defaultIngredientId={dialogIngredientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AddIngredientDialog
        open={addIngredientOpen}
        onOpenChange={setAddIngredientOpen}
        existingCategories={existingCategories}
      />

      <EditIngredientDialog
        open={editIngredientOpen}
        onOpenChange={setEditIngredientOpen}
        ingredient={editIngredient}
        existingCategories={existingCategories}
      />

      <IngredientUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}
