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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateRecipeIngredients, updateMenuMetadata } from '../_actions/updateRecipe';
import { deleteMenu } from '../_actions/createMenu';
import { removeOptionLink } from '../_actions/optionActions';
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
  unit?: string;
};

type Category = {
  id: string;
  name: string;
};

type MenuOptionItem = {
  link_id: string;
  option_id: string;
  option_name: string;
  option_category: string;
  additional_price: number;
  image_url?: string;
  is_active: boolean;
};

type EditRecipeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: string;
  menuName: string;
  ingredients: Ingredient[];
  imageUrl?: string;
  allIngredients: AllIngredient[];
  categories?: Category[];
  currentCategoryId?: string | null;
  menuOptions?: MenuOptionItem[];
};

export function EditRecipeDialog({
  open,
  onOpenChange,
  menuId,
  menuName,
  ingredients,
  imageUrl,
  allIngredients,
  categories = [],
  currentCategoryId,
  menuOptions = [],
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
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [localOptions, setLocalOptions] = React.useState<MenuOptionItem[]>([]);

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
      setSelectedCategoryId(currentCategoryId || null);
      setLocalOptions(menuOptions);
    }
  }, [open, ingredients, imageUrl, allIngredients, currentCategoryId, menuOptions]);

  const handleQtyChange = (index: number, value: string) => {
    const newIngredients = [...editedIngredients];
    newIngredients[index].qty = value === '' ? 0 : Number(value);
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
          unit: unusedIngredient.unit || 'g',
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
      newIngredients[index].unit = selected.unit || 'g';
      setEditedIngredients(newIngredients);
    }
  };

  const handleRemoveOption = async (linkId: string) => {
    try {
      const result = await removeOptionLink(linkId);
      if (result.success) {
        setLocalOptions(localOptions.filter((opt) => opt.link_id !== linkId));
        toast.success('옵션이 제거되었습니다.');
      } else {
        toast.error('옵션 제거 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Remove option error:', error);
      toast.error('옵션 제거 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 메뉴 메타데이터 업데이트 (이미지 URL, 카테고리)
      const imageChanged = menuImageUrl !== (imageUrl || '');
      const categoryChanged = selectedCategoryId !== (currentCategoryId || null);

      if (imageChanged || categoryChanged) {
        const metadataResult = await updateMenuMetadata(menuId, {
          ...(imageChanged && { image_url: menuImageUrl }),
          ...(categoryChanged && { category_id: selectedCategoryId }),
        });
        if (!metadataResult.success) {
          toast.error('저장 실패: ' + metadataResult.error);
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
        toast.success('저장되었습니다.');
        onOpenChange(false);
      } else {
        toast.error('저장 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteMenu(menuId);
      if (result.success) {
        setShowDeleteConfirm(false);
        onOpenChange(false);
        toast.success('메뉴가 삭제되었습니다.');
      } else {
        toast.error('삭제 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

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

          {/* 카테고리 선택 */}
          {categories.length > 0 && (
            <div className='space-y-2'>
              <Label>카테고리</Label>
              <Select
                value={selectedCategoryId || 'uncategorized'}
                onValueChange={(value) =>
                  setSelectedCategoryId(value === 'uncategorized' ? null : value)
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='카테고리 선택' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='uncategorized'>미분류</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
            <h4 className='font-medium mb-3'>레시피 재료</h4>
          </div>
        </div>
        <div className='space-y-4'>
          {editedIngredients.map((ing, index) => (
            <div key={index} className='flex items-center gap-2'>
              <Select
                value={ing.ingredient_id}
                onValueChange={(value) => handleIngredientSelect(index, value)}
              >
                <SelectTrigger className='flex-1'>
                  <SelectValue placeholder='재료 선택' />
                </SelectTrigger>
                <SelectContent>
                  {allIngredients
                    .filter(
                      (opt) =>
                        opt.ingredient_id === ing.ingredient_id ||
                        !editedIngredients.some(
                          (e) => e.ingredient_id === opt.ingredient_id
                        )
                    )
                    .map((opt) => (
                      <SelectItem key={opt.ingredient_id} value={opt.ingredient_id}>
                        {opt.ingredient_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                readOnly
                className='w-20 bg-muted'
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

        {/* 메뉴 옵션 섹션 */}
        {localOptions.length > 0 && (
          <div className='border-t border-gray-200 dark:border-gray-700 pt-4 mt-4'>
            <h4 className='font-medium mb-3'>메뉴 옵션 ({localOptions.length}개)</h4>
            <div className='space-y-2'>
              {localOptions.map((option) => (
                <div
                  key={option.link_id}
                  className='flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300'>
                      {option.option_name.charAt(0)}
                    </div>
                    <div>
                      <p className='font-medium text-sm'>{option.option_name}</p>
                      <p className='text-xs text-blue-600 dark:text-blue-400'>
                        +{new Intl.NumberFormat('ko-KR').format(option.additional_price)}원
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleRemoveOption(option.link_id)}
                    className='text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className='flex justify-between sm:justify-between'>
          <Button
            variant='destructive'
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting || isLoading}
          >
            <Trash2 className='h-4 w-4 mr-2' />
            메뉴 삭제
          </Button>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isLoading || isDeleting}>
              {isLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* 삭제 확인 모달 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{menuName}&quot; 메뉴를 삭제하시겠습니까?
              <br />
              레시피도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className='bg-destructive text-white hover:bg-destructive/90'
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
