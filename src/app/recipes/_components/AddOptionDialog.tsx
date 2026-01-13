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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { createOptionWithLink } from '../_actions/optionActions';
import { ImageUpload } from '@/components/ImageUpload';
import { useBranch } from '@/contexts/BranchContext';

type Category = {
  id: string;
  name: string;
};

type Menu = {
  menu_id: string;
  menu_name: string;
  category_id?: string;
};

type OptionItem = {
  link_id: string;
  option_id: string;
  option_name: string;
  option_category: string;
  additional_price: number;
  image_url?: string;
  is_active: boolean;
};

type AddOptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  menus: Menu[];
  preselectedCategoryId?: string;
  optionsByCategory: Record<string, OptionItem[]>;
  optionsByMenu: Record<string, OptionItem[]>;
};

const optionTypeLabels: Record<string, string> = {
  edge: 'EDGE 옵션',
  topping: 'TOPPING 옵션',
  beverage: '음료',
  size: '사이즈',
  extra: '추가 옵션',
};

export function AddOptionDialog({
  open,
  onOpenChange,
  categories,
  menus,
  preselectedCategoryId,
  optionsByCategory,
  optionsByMenu,
}: AddOptionDialogProps) {
  const { currentBranch } = useBranch();
  const [formData, setFormData] = React.useState({
    option_name: '',
    option_type: 'topping' as string,
    additional_price: 0,
    image_url: '',
  });
  const [linkType, setLinkType] = React.useState<'category' | 'menu'>('category');
  const [selectedMenuId, setSelectedMenuId] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  // 선택된 카테고리 이름 찾기
  const selectedCategory = categories.find((cat) => cat.id === preselectedCategoryId);

  // 해당 카테고리에 속한 메뉴만 필터링
  const filteredMenus = menus.filter((menu) => menu.category_id === preselectedCategoryId);

  // 현재 선택된 범위에 따른 기존 옵션 목록
  const existingOptions = React.useMemo(() => {
    if (linkType === 'category' && preselectedCategoryId) {
      return optionsByCategory[preselectedCategoryId] || [];
    }
    if (linkType === 'menu' && selectedMenuId) {
      return optionsByMenu[selectedMenuId] || [];
    }
    return [];
  }, [linkType, preselectedCategoryId, selectedMenuId, optionsByCategory, optionsByMenu]);

  // 다이얼로그 열릴 때 초기화
  React.useEffect(() => {
    if (open) {
      setFormData({
        option_name: '',
        option_type: 'topping',
        additional_price: 0,
        image_url: '',
      });
      setLinkType('category');
      setSelectedMenuId('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!formData.option_name.trim()) {
      toast.error('옵션명을 입력해주세요.');
      return;
    }

    if (!currentBranch?.id) {
      toast.error('지점 정보가 없습니다.');
      return;
    }

    if (!preselectedCategoryId) {
      toast.error('카테고리 정보가 없습니다.');
      return;
    }

    if (linkType === 'menu' && !selectedMenuId) {
      toast.error('메뉴를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createOptionWithLink({
        option_name: formData.option_name,
        option_category: formData.option_type,
        additional_price: formData.additional_price,
        image_url: formData.image_url || undefined,
        branch_id: currentBranch.id,
        link_type: linkType,
        category_id: linkType === 'category' ? preselectedCategoryId : undefined,
        menu_id: linkType === 'menu' ? selectedMenuId : undefined,
      });

      if (result.success) {
        toast.success('옵션이 추가되었습니다.');
        onOpenChange(false);
      } else {
        toast.error('추가 실패: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>옵션 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* 카테고리 표시 (읽기 전용) */}
          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="px-3 py-2 rounded-md border bg-muted text-muted-foreground">
              {selectedCategory?.name || '알 수 없음'}
            </div>
          </div>

          {/* 옵션명 */}
          <div className="space-y-2">
            <Label htmlFor="option_name">옵션명</Label>
            <Input
              id="option_name"
              value={formData.option_name}
              onChange={(e) =>
                setFormData({ ...formData, option_name: e.target.value })
              }
              placeholder="예: 스트링치즈엣지"
            />
          </div>

          {/* 옵션 타입 */}
          <div className="space-y-2">
            <Label htmlFor="option_type">옵션 타입</Label>
            <Select
              value={formData.option_type}
              onValueChange={(value) =>
                setFormData({ ...formData, option_type: value })
              }
            >
              <SelectTrigger id="option_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(optionTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 추가 가격 */}
          <div className="space-y-2">
            <Label htmlFor="additional_price">추가 가격 (원)</Label>
            <Input
              id="additional_price"
              type="number"
              value={formData.additional_price || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  additional_price: e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
              placeholder="2000"
            />
          </div>

          {/* 적용 범위 선택 */}
          <div className="space-y-2">
            <Label>적용 범위</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={linkType === 'category' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLinkType('category');
                  setSelectedMenuId('');
                }}
              >
                카테고리 전체
              </Button>
              <Button
                type="button"
                variant={linkType === 'menu' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLinkType('menu')}
                disabled={filteredMenus.length === 0}
              >
                특정 메뉴만
              </Button>
            </div>
          </div>

          {/* 메뉴 선택 (특정 메뉴만 선택 시) */}
          {linkType === 'menu' && (
            <div className="space-y-2">
              <Label htmlFor="menu_select">메뉴 선택</Label>
              <Select
                value={selectedMenuId}
                onValueChange={setSelectedMenuId}
              >
                <SelectTrigger id="menu_select">
                  <SelectValue placeholder="메뉴 선택" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMenus.map((menu) => (
                    <SelectItem key={menu.menu_id} value={menu.menu_id}>
                      {menu.menu_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <Label>이미지 (선택사항)</Label>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) =>
                setFormData({ ...formData, image_url: url || '' })
              }
              folder="options"
            />
          </div>

          {/* 기존 옵션 목록 */}
          {existingOptions.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <Label className="text-sm text-muted-foreground">
                기존 옵션 ({existingOptions.length}개)
              </Label>
              <div className="mt-2 space-y-2">
                {existingOptions.map((option) => (
                  <div
                    key={option.link_id}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                        {option.option_name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{option.option_name}</span>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      +{new Intl.NumberFormat('ko-KR').format(option.additional_price)}원
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? '추가 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
