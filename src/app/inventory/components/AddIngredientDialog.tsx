'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { createIngredientAction } from '../actions';
import { useBranch } from '@/contexts/BranchContext';

// 단위 목록 (그룹별)
const UNIT_GROUPS = [
  {
    label: '무게',
    options: [
      { value: 'kg', label: 'kg (킬로그램)' },
      { value: 'g', label: 'g (그램)' },
      { value: 'mg', label: 'mg (밀리그램)' },
      { value: 'lb', label: 'lb (파운드)' },
      { value: 'oz', label: 'oz (온스)' },
    ],
  },
  {
    label: '부피',
    options: [
      { value: 'L', label: 'L (리터)' },
      { value: 'mL', label: 'mL (밀리리터)' },
      { value: '컵', label: '컵' },
      { value: 'Tbsp', label: 'Tbsp (큰술)' },
      { value: 'tsp', label: 'tsp (작은술)' },
    ],
  },
  {
    label: '개수',
    options: [
      { value: 'ea', label: 'ea (개)' },
      { value: '팩', label: '팩' },
      { value: '박스', label: '박스' },
      { value: '봉지', label: '봉지' },
      { value: '병', label: '병' },
      { value: '캔', label: '캔' },
      { value: '통', label: '통' },
    ],
  },
  {
    label: '기타 단위',
    options: [
      { value: '줄기', label: '줄기' },
      { value: '장', label: '장' },
      { value: '조각', label: '조각' },
      { value: '인분', label: '인분' },
      { value: '묶음', label: '묶음' },
      { value: '포기', label: '포기' },
    ],
  },
  {
    label: '직접 입력',
    options: [{ value: '기타', label: '기타 (직접 입력)' }],
  },
];

// 카테고리 목록
const CATEGORY_OPTIONS = [
  { value: '육류', label: '육류' },
  { value: '해산물', label: '해산물' },
  { value: '채소', label: '채소' },
  { value: '과일', label: '과일' },
  { value: '유제품', label: '유제품' },
  { value: '곡물/분류', label: '곡물/분류' },
  { value: '소스/양념', label: '소스/양념' },
  { value: '음료', label: '음료' },
  { value: '냉동식품', label: '냉동식품' },
  { value: '건조식품', label: '건조식품' },
  { value: '기타', label: '기타 (직접 입력)' },
];

type AddIngredientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCategories?: string[];
};

export function AddIngredientDialog({
  open,
  onOpenChange,
  existingCategories = [],
}: AddIngredientDialogProps) {
  const { currentBranch } = useBranch();
  const [isLoading, setIsLoading] = React.useState(false);

  // Form state
  const [ingredientName, setIngredientName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [customCategory, setCustomCategory] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [customUnit, setCustomUnit] = React.useState('');
  const [currentQty, setCurrentQty] = React.useState('');
  const [reorderPoint, setReorderPoint] = React.useState('');
  const [safetyStock, setSafetyStock] = React.useState('');

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setIngredientName('');
      setCategory('');
      setCustomCategory('');
      setUnit('');
      setCustomUnit('');
      setCurrentQty('');
      setReorderPoint('');
      setSafetyStock('');
    }
  }, [open]);

  const handleSave = async () => {
    const trimmedName = ingredientName.trim();
    const finalCategory =
      category === '기타' ? customCategory.trim() : category;
    const finalUnit = unit === '기타' ? customUnit.trim() : unit;

    if (!trimmedName) {
      toast.error('재료명을 입력해주세요.');
      return;
    }

    if (!finalCategory) {
      toast.error(
        category === '기타'
          ? '카테고리를 입력해주세요.'
          : '카테고리를 선택해주세요.',
      );
      return;
    }

    if (!finalUnit) {
      toast.error(
        unit === '기타' ? '단위를 입력해주세요.' : '단위를 선택해주세요.',
      );
      return;
    }

    if (!currentBranch?.id) {
      toast.error('지점 정보가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createIngredientAction({
        ingredient_name: trimmedName,
        category: finalCategory,
        unit: finalUnit,
        current_qty: currentQty ? Number(currentQty) : undefined,
        reorder_point: reorderPoint ? Number(reorderPoint) : undefined,
        safety_stock: safetyStock ? Number(safetyStock) : undefined,
        branch_id: currentBranch.id,
      });

      if (result.success) {
        toast.success('재료가 추가되었습니다.');
        onOpenChange(false);
      } else {
        toast.error(result.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] sm:top-[10%] sm:translate-y-0'>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <DialogHeader>
            <DialogTitle>재료 추가</DialogTitle>
            <DialogDescription>
              새로운 재료를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
          {/* 재료명 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='ingredientName' className='text-right'>
              재료명 *
            </Label>
            <Input
              id='ingredientName'
              className='col-span-3 placeholder:text-gray-400'
              value={ingredientName}
              onChange={(e) => setIngredientName(e.target.value)}
              placeholder='예: 밀가루, 토마토'
            />
          </div>

          {/* 카테고리 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='category' className='text-right'>
              카테고리 *
            </Label>
            <div className='col-span-3'>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder='카테고리 선택' />
                </SelectTrigger>
                <SelectContent>
                  {existingCategories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className='text-gray-400 text-xs'>
                        기존 카테고리
                      </SelectLabel>
                      {existingCategories.map((cat) => (
                        <SelectItem key={`existing-${cat}`} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  <SelectGroup>
                    <SelectLabel className='text-gray-400 text-xs'>
                      전체 카테고리
                    </SelectLabel>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {category === '기타' && (
                <Input
                  className='mt-2 placeholder:text-gray-400'
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder='카테고리 직접 입력'
                />
              )}
            </div>
          </div>

          {/* 단위 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='unit' className='text-right'>
              단위 *
            </Label>
            <div className='col-span-3'>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder='단위 선택' />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel className='text-gray-400 text-xs'>
                        {group.label}
                      </SelectLabel>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {unit === '기타' && (
                <Input
                  className='mt-2 placeholder:text-gray-400'
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder='단위 직접 입력'
                />
              )}
            </div>
          </div>

          {/* 초기수량 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='currentQty' className='text-right'>
              초기수량
            </Label>
            <Input
              id='currentQty'
              className='col-span-3 placeholder:text-gray-400'
              type='number'
              min='0'
              value={currentQty}
              onChange={(e) => setCurrentQty(e.target.value)}
              placeholder='0'
            />
          </div>

          {/* 재주문점 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='reorderPoint' className='text-right'>
              재주문점
            </Label>
            <Input
              id='reorderPoint'
              className='col-span-3 placeholder:text-gray-400'
              type='number'
              min='0'
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              placeholder='이 이하면 주문 필요'
            />
          </div>

          {/* 안전재고 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='safetyStock' className='text-right'>
              안전재고
            </Label>
            <Input
              id='safetyStock'
              className='col-span-3 placeholder:text-gray-400'
              type='number'
              min='0'
              value={safetyStock}
              onChange={(e) => setSafetyStock(e.target.value)}
              placeholder='최소 유지 재고'
            />
          </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  저장 중...
                </>
              ) : (
                '재료 추가'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
