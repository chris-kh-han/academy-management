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
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { createMenu } from '../_actions/createMenu';
import { useBranch } from '@/contexts/BranchContext';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ImageUpload';

type AllIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  category: string;
};

type AddMenuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allIngredients: AllIngredient[];
  categoryId?: string; // 카테고리 ID를 prop으로 받음 (optional for backward compatibility)
};

export function AddMenuDialog({
  open,
  onOpenChange,
  allIngredients,
  categoryId,
}: AddMenuDialogProps) {
  const { currentBranch } = useBranch();
  const [isLoading, setIsLoading] = React.useState(false);

  // 메뉴 기본 정보
  const [menuName, setMenuName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  // 레시피 재료
  const [ingredients, setIngredients] = React.useState<
    {
      ingredient_id: string;
      name: string;
      category: string;
      qty: number;
      unit: string;
      loss_rate: number;
    }[]
  >([]);

  // 다이얼로그 열릴 때 초기화
  React.useEffect(() => {
    if (open) {
      setMenuName('');
      setPrice('');
      setImageUrl(null);
      setIngredients([]);
    }
  }, [open]);

  const handleAddIngredient = () => {
    const unusedIngredient = allIngredients.find(
      (ing) => !ingredients.some((e) => e.ingredient_id === ing.ingredient_id),
    );
    if (unusedIngredient) {
      setIngredients([
        ...ingredients,
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

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientSelect = (index: number, ingredientId: string) => {
    const selected = allIngredients.find(
      (ing) => ing.ingredient_id === ingredientId,
    );
    if (selected) {
      const newIngredients = [...ingredients];
      newIngredients[index].ingredient_id = ingredientId;
      newIngredients[index].name = selected.ingredient_name;
      newIngredients[index].category = selected.category;
      setIngredients(newIngredients);
    }
  };

  const handleQtyChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    // 빈 값이면 0, 아니면 숫자로 변환 (leading zero 제거)
    newIngredients[index].qty = value === '' ? 0 : Number(value);
    setIngredients(newIngredients);
  };

  const handleUnitChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index].unit = value;
    setIngredients(newIngredients);
  };

  const handleSave = async () => {
    // 공백 제거된 값으로 검증
    const trimmedMenuName = menuName.replace(/\s/g, '');

    if (!trimmedMenuName) {
      alert('메뉴 이름을 입력해주세요.');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert('가격을 입력해주세요.');
      return;
    }
    if (!currentBranch?.id) {
      alert('지점 정보가 없습니다.');
      return;
    }
    if (!categoryId) {
      alert('카테고리 정보가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createMenu(
        {
          menu_name: trimmedMenuName,
          category_id: categoryId, // category 대신 category_id 사용
          price: parseFloat(price),
          branch_id: currentBranch.id,
          image_url: imageUrl,
        },
        ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          ingredient_name: ing.name,
          ingredient_category: ing.category,
          required_qty: ing.qty,
          unit: ing.unit,
          loss_rate: ing.loss_rate,
        })),
      );

      if (result.success) {
        if (result.warning) {
          alert(result.warning);
        }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>새 메뉴 추가</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* 메뉴 기본 정보 */}
          <div className='space-y-4'>
            <h3 className='font-medium text-sm text-muted-foreground'>
              메뉴 정보
            </h3>

            {/* 이미지 업로드 */}
            <div className='space-y-2'>
              <Label>메뉴 이미지 (선택사항)</Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder='menus'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='menuName'>메뉴 이름 *</Label>
              <Input
                id='menuName'
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder='예: 마르게리타 피자'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='price'>가격 (원) *</Label>
              <Input
                id='price'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder='예: 15000'
                className='w-48'
              />
            </div>
          </div>

          {/* 레시피 재료 */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='font-medium text-sm text-muted-foreground'>
                레시피 재료 (선택)
              </h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddIngredient}
              >
                <Plus className='h-4 w-4 mr-1' />
                재료 추가
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4 border rounded-md'>
                아직 추가된 재료가 없습니다. 나중에 수정할 수도 있습니다.
              </p>
            ) : (
              <div className='space-y-2'>
                {ingredients.map((ing, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <select
                      value={ing.ingredient_id}
                      onChange={(e) =>
                        handleIngredientSelect(index, e.target.value)
                      }
                      className='flex-1 rounded-md border px-3 py-2 text-sm'
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
                      className='w-20'
                      placeholder='수량'
                    />
                    <Input
                      type='text'
                      value={ing.unit}
                      onChange={(e) => handleUnitChange(index, e.target.value)}
                      className='w-16'
                      placeholder='단위'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleRemoveIngredient(index)}
                    >
                      <Trash2 className='h-4 w-4 text-red-500' />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                저장 중...
              </>
            ) : (
              '메뉴 추가'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
