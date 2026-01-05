'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IngredientsTable, Ingredient } from './IngredientsTable';
import { MovementsTable } from './MovementsTable';
import { MovementsSummary } from './MovementsSummary';
import { MovementFormDialog } from './MovementFormDialog';
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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<MovementType>('in');
  const [dialogIngredientId, setDialogIngredientId] = React.useState<
    number | undefined
  >(undefined);

  const ingredientOptions = ingredients.map((i) => ({
    id: Number(i.id),
    name: i.ingredient_name,
    unit: i.unit,
  }));

  const handleOpenMovementDialog = (
    type: MovementType,
    ingredientId?: number,
  ) => {
    setDialogType(type);
    setDialogIngredientId(ingredientId);
    setDialogOpen(true);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>재고 관리</h1>
          <p className='text-muted-foreground'>
            재료 재고 현황을 확인하고 입출고를 관리합니다.
          </p>
        </div>
        <Button onClick={() => handleOpenMovementDialog('in')}>
          <Plus className='mr-2 h-4 w-4' />
          입고
        </Button>
      </div>

      <Tabs defaultValue='status' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='status'>현황</TabsTrigger>
          <TabsTrigger value='history'>입출고 이력</TabsTrigger>
        </TabsList>

        <TabsContent value='status' className='space-y-6'>
          <MovementsSummary summary={summary} />
          <IngredientsTable
            data={ingredients}
            onMovement={handleOpenMovementDialog}
          />
        </TabsContent>

        <TabsContent value='history'>
          <MovementsTable data={movements} />
        </TabsContent>
      </Tabs>

      <MovementFormDialog
        ingredients={ingredientOptions}
        defaultType={dialogType}
        defaultIngredientId={dialogIngredientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
