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
import { Loader2 } from 'lucide-react';
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

  const [name, setName] = React.useState(category.name);
  const [icon, setIcon] = React.useState(category.icon);
  const [customIcon, setCustomIcon] = React.useState('');

  // 다이얼로그 열릴 때 초기화
  React.useEffect(() => {
    if (open) {
      setName(category.name);
      setIcon(category.icon);
      // 기본 아이콘에 없으면 커스텀으로 처리
      if (!PREDEFINED_ICONS.includes(category.icon)) {
        setCustomIcon(category.icon);
      } else {
        setCustomIcon('');
      }
    }
  }, [open, category]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const finalIcon = customIcon.trim() || icon;

    if (!trimmedName) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const slug = trimmedName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const result = await updateCategory(category.id, {
        name: trimmedName,
        slug,
        icon: finalIcon,
      });

      if (result.success) {
        onOpenChange(false);
      } else {
        alert('수정 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('수정 중 오류가 발생했습니다.');
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
            <Label>아이콘 선택 *</Label>
            <div className="grid grid-cols-8 gap-2 p-2 border rounded-md bg-white dark:bg-gray-950">
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
              onChange={(e) => setCustomIcon(e.target.value)}
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
          <Button onClick={handleSave} disabled={isLoading}>
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
    </Dialog>
  );
}
