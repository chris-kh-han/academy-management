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
import { Loader2, Ban } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateCategory } from '../_actions/categoryActions';
import { cn } from '@/lib/utils';
import type { MenuCategory } from '@/types';

type EditCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: MenuCategory;
};

// 미리 정의된 이모지 목록
const PREDEFINED_ICONS = [
  '🍕', '🍝', '🍔', '🥗', '🍰', '🥤', '🍺', '☕',
  '🍖', '🍗', '🌮', '🌯', '🥪', '🍜', '🍛', '🍱',
  '🧀', '🥓', '🥩', '🍣', '🍤', '🍦', '🧁', '🍩',
];

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
}: EditCategoryDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [processedName, setProcessedName] = React.useState('');

  const [name, setName] = React.useState(category.name);
  const [icon, setIcon] = React.useState<string | null>(category.icon);
  const [customIcon, setCustomIcon] = React.useState('');

  // 다이얼로그 열릴 때 초기화
  React.useEffect(() => {
    if (open) {
      setName(category.name);
      // 아이콘이 없거나 프리셋에 없으면 처리
      if (!category.icon) {
        setIcon(null);
        setCustomIcon('');
      } else if (!PREDEFINED_ICONS.includes(category.icon)) {
        setIcon(null);
        setCustomIcon(category.icon);
      } else {
        setIcon(category.icon);
        setCustomIcon('');
      }
    }
  }, [open, category]);

  // 직접 입력 시 아이콘 선택 해제
  const handleCustomIconChange = (value: string) => {
    setCustomIcon(value);
    if (value.trim()) {
      setIcon(null);
    }
  };

  // 이름 정규화: 앞뒤 공백 제거 + 연속 공백을 단일 공백으로
  const normalizeName = (input: string) => {
    return input.trim().replace(/\s+/g, ' ');
  };

  const handleSaveClick = () => {
    const normalized = normalizeName(name);

    if (!normalized) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    setProcessedName(normalized);
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    const finalIcon = customIcon.trim() || icon || '';

    setIsLoading(true);
    setShowConfirm(false);

    try {
      const slug = processedName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const result = await updateCategory(category.id, {
        name: processedName,
        slug,
        icon: finalIcon,
      });

      if (result.success) {
        toast.success('카테고리가 수정되었습니다.');
        onOpenChange(false);
      } else {
        toast.error('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 카테고리 이름 */}
          <div className="space-y-2">
            <Label htmlFor="categoryName">카테고리 이름 *</Label>
            <Input
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 피자, 파스타"
            />
          </div>

          {/* 아이콘 선택 */}
          <div className="space-y-2">
            <Label>아이콘 선택</Label>
            <div className="grid grid-cols-8 gap-2 p-2 border rounded-md bg-white dark:bg-gray-950">
              {/* 선택 안 함 옵션 */}
              <button
                type="button"
                onClick={() => {
                  setIcon(null);
                  setCustomIcon('');
                }}
                className={cn(
                  'text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center',
                  icon === null && !customIcon && 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400',
                )}
                title="선택 안 함"
              >
                <Ban className="h-5 w-5 text-gray-400" />
              </button>
              {PREDEFINED_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setIcon(emoji);
                    setCustomIcon('');
                  }}
                  className={cn(
                    'text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                    icon === emoji && !customIcon && 'bg-orange-100 dark:bg-orange-900 ring-2 ring-orange-500',
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 커스텀 아이콘 입력 */}
          <div className="space-y-2">
            <Label htmlFor="customIcon">또는 직접 입력</Label>
            <Input
              id="customIcon"
              value={customIcon}
              onChange={(e) => handleCustomIconChange(e.target.value)}
              onFocus={() => setIcon(null)}
              placeholder="이모지를 직접 입력하세요"
              maxLength={2}
            />
            {customIcon && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                선택된 아이콘: <span className="text-2xl">{customIcon}</span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button onClick={handleSaveClick} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                수정 중...
              </>
            ) : (
              '수정 완료'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 확인 모달 */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 수정 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>다음과 같이 수정하시겠습니까?</p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                  {(customIcon.trim() || icon) && (
                    <span className="text-3xl">{customIcon.trim() || icon}</span>
                  )}
                  <span className="font-semibold text-lg text-foreground">
                    {processedName}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
