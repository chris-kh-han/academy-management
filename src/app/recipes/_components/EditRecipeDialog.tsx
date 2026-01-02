'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { updateRecipeIngredients, updateMenuMetadata } from '../_actions/updateRecipe';
import { ImageUpload } from '@/components/ImageUpload';

type Ingredient = {
  ingredient_id: string;
  name: string | undefined;
  category: string | undefined;
  qty: number | null;
  unit: string | undefined;
  loss_rate: number | null;
};

type AllIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  category: string;
};

type EditRecipeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  menuName: string;
  ingredients: Ingredient[];
  imageUrl?: string;
  allIngredients: AllIngredient[];
};

export function EditRecipeDialog({
  open,
  onOpenChange,
  menuId,
  menuName,
  ingredients,
  imageUrl,
  allIngredients,
}: EditRecipeDialogProps) {
  const [editedIngredients, setEditedIngredients] = React.useState<
    {
      ingredient_id: string;
      name: string;
      category: string;
      qty: number;
      unit: string;
      loss_rate: number;
    }[]
  >([]);
  const [menuImageUrl, setMenuImageUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setEditedIngredients(
        ingredients.map((ing) => {
          const found = allIngredients.find(
            (a) => a.ingredient_id === ing.ingredient_id,
          );
          return {
            ingredient_id: ing.ingredient_id,
            name: ing.name ?? '',
            category: found?.category ?? ing.category ?? '',
            qty: ing.qty ?? 0,
            unit: ing.unit ?? '',
            loss_rate: ing.loss_rate ?? 0,
          };
        }),
      );
      setMenuImageUrl(imageUrl || '');
    }
  }, [open, ingredients, imageUrl, allIngredients]);

  const handleQtyChange = (index: number, value: string) => {
    const newIngredients = [...editedIngredients];
    newIngredients[index].qty = value === '' ? 0 : Number(value);
    setEditedIngredients(newIngredients);
  };

  const handleUnitChange = (index: number, value: string) => {
    const newIngredients = [...editedIngredients];
    newIngredients[index].unit = value;
    setEditedIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setEditedIngredients(editedIngredients.filter((_, i) => i !== index));
  };

  const handleAddIngredient = () => {
    const unusedIngredient = allIngredients.find(
      (ing) =>
        !editedIngredients.some((e) => e.ingredient_id === ing.ingredient_id),
    );
    if (unusedIngredient) {
      setEditedIngredients([
        ...editedIngredients,
        {
          ingredient_id: unusedIngredient.ingredient_id,
          name: unusedIngredient.ingredient_name,
          category: unusedIngredient.category,
          qty: 0,
          unit: 'g',
          loss_rate: 0,
        },
      ]);
    }
  };

  const handleIngredientSelect = (index: number, ingredientId: string) => {
    const selected = allIngredients.find(
      (ing) => ing.ingredient_id === ingredientId,
    );
    if (selected) {
      const newIngredients = [...editedIngredients];
      newIngredients[index].ingredient_id = ingredientId;
      newIngredients[index].name = selected.ingredient_name;
      newIngredients[index].category = selected.category;
      setEditedIngredients(newIngredients);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 메뉴 메타데이터 업데이트 (이미지 URL)
      if (menuImageUrl !== (imageUrl || '')) {
        const metadataResult = await updateMenuMetadata(menuId, {
          image_url: menuImageUrl,
        });
        if (!metadataResult.success) {
          alert('이미지 저장 실패: ' + metadataResult.error);
          setIsLoading(false);
          return;
        }
      }

      // 레시피 재료 업데이트
      const result = await updateRecipeIngredients(
        menuId,
        editedIngredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.name,
          ingredient_category: ing.category,
          required_qty: ing.qty,
          unit: ing.unit,
          loss_rate: ing.loss_rate,
        })),
      );
      if (result.success) {
        onOpenChange(false);
      } else {
        alert('저장 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  console.log(editedIngredients);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{menuName} - 재료 및 이미지 수정</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {/* 메뉴 이미지 업로드 */}
          <div className='space-y-2'>
            <Label>메뉴 이미지 (선택사항)</Label>
            <ImageUpload
              value={menuImageUrl}
              onChange={(url) => setMenuImageUrl(url || '')}
              folder='menus'
            />
          </div>

          <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
            <h4 className='font-medium mb-3'>레시피 재료</h4>
          </div>
        </div>
        <div className='space-y-4'>
          {editedIngredients.map((ing, index) => (
            <div key={index} className='flex items-center gap-2'>
              <select
                value={ing.ingredient_id}
                onChange={(e) => handleIngredientSelect(index, e.target.value)}
                className='flex-1 rounded-md border px-3 py-2'
              >
                {allIngredients.map((opt) => (
                  <option key={opt.ingredient_id} value={opt.ingredient_id}>
                    {opt.ingredient_name}
                  </option>
                ))}
              </select>
              <Input
                type='number'
                value={ing.qty || ''}
                onChange={(e) => handleQtyChange(index, e.target.value)}
                className='w-24'
                placeholder='수량'
              />
              <Input
                type='text'
                value={ing.unit}
                onChange={(e) => handleUnitChange(index, e.target.value)}
                className='w-20'
                placeholder='단위'
              />
              <Button
                variant='ghost'
                size='icon'
                onClick={() => handleRemoveIngredient(index)}
              >
                <Trash2 className='h-4 w-4 text-red-500' />
              </Button>
            </div>
          ))}
          <Button variant='outline' onClick={handleAddIngredient}>
            <Plus className='h-4 w-4 mr-2' />
            재료 추가
          </Button>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
