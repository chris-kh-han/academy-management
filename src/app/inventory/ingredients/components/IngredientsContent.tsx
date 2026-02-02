'use client';

import * as React from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IngredientsTable, Ingredient } from '../../components/IngredientsTable';
import { MovementFormDialog } from '../../components/MovementFormDialog';
import { AddIngredientDialog } from '../../components/AddIngredientDialog';
import { EditIngredientDialog } from '../../components/EditIngredientDialog';
import { IngredientUploadDialog } from '../../components/IngredientUploadDialog';
import type { StockMovement, MovementType } from '@/types';

type IngredientsContentProps = {
  ingredients: Ingredient[];
  movements: StockMovement[];
};

export function IngredientsContent({
  ingredients,
  movements,
}: IngredientsContentProps) {
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

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>재료 관리</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            재료 정보를 등록하고 관리합니다.
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

      <IngredientsTable
        data={ingredients}
        onMovement={handleOpenMovementDialog}
        onEdit={handleEditIngredient}
      />

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
