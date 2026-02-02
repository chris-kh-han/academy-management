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

// 우선순위 옵션
const PRIORITY_OPTIONS = [
  { value: '1', label: '1순위 (필수)', description: '없으면 영업 불가' },
  { value: '2', label: '2순위 (중요)', description: '영업에 영향' },
  { value: '3', label: '3순위 (보조)', description: '없어도 영업 가능' },
];

// 기본 보관위치 옵션
const DEFAULT_STORAGE_LOCATIONS = [
  '냉장고1',
  '냉장고2',
  '냉동고',
  '창고',
  '매장',
  '주방',
];

type AddIngredientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCategories?: string[];
  existingStorageLocations?: string[];
};

export function AddIngredientDialog({
  open,
  onOpenChange,
  existingCategories = [],
  existingStorageLocations = [],
}: AddIngredientDialogProps) {
  const { currentBranch } = useBranch();
  const [isLoading, setIsLoading] = React.useState(false);

  // Form state
  const [ingredientName, setIngredientName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [customCategory, setCustomCategory] = React.useState('');
  const [specification, setSpecification] = React.useState('');
  const [unit, setUnit] = React.useState('');
  const [customUnit, setCustomUnit] = React.useState('');
  const [currentQty, setCurrentQty] = React.useState('');
  const [reorderPoint, setReorderPoint] = React.useState('');
  const [safetyStock, setSafetyStock] = React.useState('');
  // 새로 추가된 필드
  const [priority, setPriority] = React.useState('2'); // 기본값 2순위
  const [storageLocation, setStorageLocation] = React.useState('');
  const [customStorageLocation, setCustomStorageLocation] = React.useState('');
  const [packsPerBox, setPacksPerBox] = React.useState('');
  const [unitsPerPack, setUnitsPerPack] = React.useState('');

  // 보관위치 옵션 병합 (기존 + 기본)
  const allStorageLocations = React.useMemo(() => {
    const combined = new Set([
      ...existingStorageLocations,
      ...DEFAULT_STORAGE_LOCATIONS,
    ]);
    return Array.from(combined);
  }, [existingStorageLocations]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setIngredientName('');
      setCategory('');
      setCustomCategory('');
      setSpecification('');
      setUnit('');
      setCustomUnit('');
      setCurrentQty('');
      setReorderPoint('');
      setSafetyStock('');
      setPriority('2');
      setStorageLocation('');
      setCustomStorageLocation('');
      setPacksPerBox('');
      setUnitsPerPack('');
    }
  }, [open]);

  const handleSave = async () => {
    const trimmedName = ingredientName.trim();
    const finalCategory =
      category === '기타' ? customCategory.trim() : category;
    const finalUnit = unit === '기타' ? customUnit.trim() : unit;
    const finalStorageLocation =
      storageLocation === '기타'
        ? customStorageLocation.trim()
        : storageLocation;

    if (!trimmedName) {
      toast.error('품목명을 입력해주세요.');
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
        specification: specification.trim() || undefined,
        unit: finalUnit,
        current_qty: currentQty ? Number(currentQty) : undefined,
        reorder_point: reorderPoint ? Number(reorderPoint) : undefined,
        safety_stock: safetyStock ? Number(safetyStock) : undefined,
        branch_id: currentBranch.id,
        // 새로 추가된 필드
        priority: Number(priority) as 1 | 2 | 3,
        storage_location: finalStorageLocation || undefined,
        packs_per_box: packsPerBox ? Number(packsPerBox) : undefined,
        units_per_pack: unitsPerPack ? Number(unitsPerPack) : undefined,
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
            <DialogTitle>품목 추가</DialogTitle>
            <DialogDescription>
              새로운 품목을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
          {/* 품목명 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='ingredientName' className='text-right'>
              품목명 *
            </Label>
            <Input
              id='ingredientName'
              className='col-span-3 placeholder:text-gray-400'
              value={ingredientName}
              onChange={(e) => setIngredientName(e.target.value)}
              placeholder='예: 밀가루, 토마토'
              autoComplete='off'
            />
          </div>

          {/* 카테고리/}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='category' className='text-right'>
              카테고리
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
                    {CATEGORY_OPTIONS.filter(
                      (option) => !existingCategories.includes(option.value),
                    ).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {category === '기타' && (
                <Input
                  id='customCategory'
                  className='mt-2 placeholder:text-gray-400'
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder='카테고리 직접 입력'
                  autoComplete='off'
                  aria-label='카테고리 직접 입력'
                />
              )}
            </div>
          </div>

          {/* 규격 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='specification' className='text-right'>
              규격
            </Label>
            <Input
              id='specification'
              className='col-span-3 placeholder:text-gray-400'
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder='예: 1kg*10pk, 500g*8pk'
            />
          </div>

          {/* 단위/}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='unit' className='text-right'>
              단위
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
                  id='customUnit'
                  className='mt-2 placeholder:text-gray-400'
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder='단위 직접 입력'
                  autoComplete='off'
                  aria-label='단위 직접 입력'
                />
              )}
            </div>
          </div>

          {/* 수량 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='currentQty' className='text-right'>
              수량
            </Label>
            <Input
              id='currentQty'
              className='col-span-3 placeholder:text-gray-400'
              type='number'
              inputMode='decimal'
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
              inputMode='decimal'
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
              inputMode='decimal'
              min='0'
              value={safetyStock}
              onChange={(e) => setSafetyStock(e.target.value)}
              placeholder='최소 유지 재고'
            />
          </div>

          {/* 구분선 */}
          <div className='col-span-4 border-t pt-2 mt-2'>
            <span className='text-xs text-muted-foreground'>
              마감 체크 관련 설정
            </span>
          </div>

          {/* 우선순위 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='priority' className='text-right'>
              우선순위
            </Label>
            <div className='col-span-3'>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder='우선순위 선택' />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className='flex flex-col'>
                        <span>{option.label}</span>
                        <span className='text-xs text-muted-foreground'>
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 보관 위치 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='storageLocation' className='text-right'>
              보관 위치
            </Label>
            <div className='col-span-3'>
              <Select
                value={storageLocation}
                onValueChange={setStorageLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder='보관 위치 선택' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className='text-gray-400 text-xs'>
                      위치 선택
                    </SelectLabel>
                    {allStorageLocations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                    <SelectItem value='기타'>기타 (직접 입력)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {storageLocation === '기타' && (
                <Input
                  id='customStorageLocation'
                  className='mt-2 placeholder:text-gray-400'
                  value={customStorageLocation}
                  onChange={(e) => setCustomStorageLocation(e.target.value)}
                  placeholder='보관 위치 직접 입력'
                  autoComplete='off'
                />
              )}
            </div>
          </div>

          {/* 포장 단위 */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right'>포장 단위</Label>
            <div className='col-span-3 flex gap-2'>
              <div className='flex-1'>
                <Input
                  id='packsPerBox'
                  className='placeholder:text-gray-400'
                  type='number'
                  inputMode='numeric'
                  min='1'
                  value={packsPerBox}
                  onChange={(e) => setPacksPerBox(e.target.value)}
                  placeholder='박스당 팩 수'
                />
                <span className='text-xs text-muted-foreground'>팩/박스</span>
              </div>
              <div className='flex-1'>
                <Input
                  id='unitsPerPack'
                  className='placeholder:text-gray-400'
                  type='number'
                  inputMode='numeric'
                  min='1'
                  value={unitsPerPack}
                  onChange={(e) => setUnitsPerPack(e.target.value)}
                  placeholder='팩당 낱개 수'
                />
                <span className='text-xs text-muted-foreground'>개/팩</span>
              </div>
            </div>
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
                '품목 추가'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
