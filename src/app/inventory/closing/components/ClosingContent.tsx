'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Loader2, Save, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { LocationGroup } from './LocationGroup';
import {
  getIngredientsForClosingAction,
  getTodayClosingAction,
  saveClosingAction,
  completeClosingAction,
} from '../actions';
import { useBranch } from '@/contexts/BranchContext';

type Ingredient = {
  id: string;
  ingredient_name: string;
  unit: string;
  priority?: number;
  storage_location?: string | null;
  packs_per_box?: number | null;
  units_per_pack?: number | null;
  current_qty?: number;
};

type ClosingValues = Record<
  string,
  { boxes: number; packs: number; units: number }
>;

export function ClosingContent() {
  const { currentBranch } = useBranch();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([]);
  const [closingValues, setClosingValues] = React.useState<ClosingValues>({});
  const [closingDate, setClosingDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [existingClosingId, setExistingClosingId] = React.useState<string | null>(null);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = React.useState(false);

  // 필터 상태
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [locationFilter, setLocationFilter] = React.useState<string>('all');

  // 데이터 로드
  React.useEffect(() => {
    async function loadData() {
      if (!currentBranch?.id) return;

      setIsLoading(true);
      try {
        // 재료 목록 조회
        const ingredientsData = await getIngredientsForClosingAction(
          currentBranch.id,
        );
        setIngredients(ingredientsData);

        // 기존 마감 데이터 조회
        const existingClosing = await getTodayClosingAction(
          currentBranch.id,
          closingDate,
        );

        if (existingClosing) {
          setExistingClosingId(existingClosing.id);
          setIsCompleted(existingClosing.status === 'completed');

          // 기존 값 로드
          const values: ClosingValues = {};
          for (const item of existingClosing.items || []) {
            values[item.ingredient_id] = {
              boxes: item.closing_boxes || 0,
              packs: item.closing_packs || 0,
              units: item.closing_units || 0,
            };
          }
          setClosingValues(values);
        } else {
          setExistingClosingId(null);
          setIsCompleted(false);
          setClosingValues({});
        }
      } catch (error) {
        console.error('Load error:', error);
        toast.error('데이터 로드 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentBranch?.id, closingDate]);

  // 값 변경 핸들러
  const handleValueChange = (
    ingredientId: string,
    field: 'boxes' | 'packs' | 'units',
    value: number,
  ) => {
    setClosingValues((prev) => ({
      ...prev,
      [ingredientId]: {
        ...prev[ingredientId],
        [field]: value,
      },
    }));
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!currentBranch?.id) {
      toast.error('지점 정보가 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const items = Object.entries(closingValues)
        .filter(([, v]) => v.boxes > 0 || v.packs > 0 || v.units > 0)
        .map(([ingredientId, v]) => ({
          ingredient_id: ingredientId,
          closing_boxes: v.boxes || 0,
          closing_packs: v.packs || 0,
          closing_units: v.units || 0,
        }));

      const result = await saveClosingAction({
        branch_id: currentBranch.id,
        closing_date: closingDate,
        items,
      });

      if (result.success) {
        toast.success('저장되었습니다.');
        setExistingClosingId(result.closingId || null);
      } else {
        toast.error(result.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 마감 완료 핸들러
  const handleComplete = async () => {
    if (!existingClosingId) {
      toast.error('먼저 저장해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await completeClosingAction(existingClosingId);

      if (result.success) {
        toast.success('마감이 완료되었습니다. 재고가 반영되었습니다.');
        setIsCompleted(true);
      } else {
        toast.error(result.error || '마감 완료에 실패했습니다.');
      }
    } catch (error) {
      console.error('Complete error:', error);
      toast.error('마감 완료 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
      setShowCompleteDialog(false);
    }
  };

  // 보관위치별 그룹핑
  const groupedIngredients = React.useMemo(() => {
    let filtered = ingredients;

    // 우선순위 필터
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(
        (ing) => ing.priority === Number(priorityFilter),
      );
    }

    // 보관위치 필터
    if (locationFilter !== 'all') {
      filtered = filtered.filter(
        (ing) => ing.storage_location === locationFilter,
      );
    }

    // 그룹핑
    const groups: Record<string, Ingredient[]> = {};
    for (const ingredient of filtered) {
      const location = ingredient.storage_location || '미지정';
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(ingredient);
    }

    return groups;
  }, [ingredients, priorityFilter, locationFilter]);

  // 고유 보관위치 목록
  const uniqueLocations = React.useMemo(() => {
    const locations = new Set(
      ingredients.map((ing) => ing.storage_location || '미지정'),
    );
    return Array.from(locations).sort();
  }, [ingredients]);

  // 진행률 계산
  const progress = React.useMemo(() => {
    const total = ingredients.length;
    const completed = Object.values(closingValues).filter(
      (v) => v.boxes > 0 || v.packs > 0 || v.units > 0,
    ).length;
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [ingredients.length, closingValues]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 헤더 */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>마감 체크</h1>
          <p className='text-muted-foreground'>
            보관위치별로 남은 재고를 입력하세요
          </p>
        </div>

        {/* 날짜 선택 */}
        <div className='flex items-center gap-2'>
          <Label htmlFor='closing-date'>날짜</Label>
          <Input
            id='closing-date'
            type='date'
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
            disabled={isCompleted}
            className='w-40'
          />
        </div>
      </div>

      {/* 상태 표시 */}
      {isCompleted && (
        <div className='bg-green-100 border border-green-300 rounded-lg p-4 flex items-center gap-3'>
          <CheckCircle className='w-6 h-6 text-green-600' />
          <div>
            <p className='font-semibold text-green-800'>마감 완료됨</p>
            <p className='text-sm text-green-700'>
              이 날짜의 마감은 이미 완료되었습니다.
            </p>
          </div>
        </div>
      )}

      {/* 필터 & 진행률 */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-3'>
          <Filter className='w-4 h-4 text-muted-foreground' />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='우선순위' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>전체</SelectItem>
              <SelectItem value='1'>1순위</SelectItem>
              <SelectItem value='2'>2순위</SelectItem>
              <SelectItem value='3'>3순위</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='보관위치' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>전체</SelectItem>
              {uniqueLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-3'>
          <span className='text-sm text-muted-foreground'>
            진행: {progress.completed}/{progress.total} ({progress.percent}%)
          </span>
          <div className='w-32 h-2 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className={`h-full transition-all duration-300 ${
                progress.percent === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 보관위치별 그룹 */}
      <div className='space-y-4'>
        {Object.entries(groupedIngredients).map(([location, ings]) => (
          <LocationGroup
            key={location}
            locationName={location}
            ingredients={ings}
            values={closingValues}
            onChange={handleValueChange}
            isCompleted={isCompleted}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {Object.keys(groupedIngredients).length === 0 && (
        <div className='text-center py-12 text-muted-foreground'>
          <p>필터 조건에 맞는 품목이 없습니다.</p>
        </div>
      )}

      {/* 액션 버튼 */}
      {!isCompleted && (
        <div className='flex justify-end gap-3 pt-4 border-t'>
          <Button
            variant='outline'
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
            ) : (
              <Save className='w-4 h-4 mr-2' />
            )}
            임시 저장
          </Button>

          <Button
            onClick={() => setShowCompleteDialog(true)}
            disabled={isSaving || progress.completed === 0}
          >
            <CheckCircle className='w-4 h-4 mr-2' />
            마감 완료
          </Button>
        </div>
      )}

      {/* 마감 완료 확인 다이얼로그 */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>마감을 완료하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              마감 완료 시 입력한 수량이 현재 재고로 반영됩니다.
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : null}
              마감 완료
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
