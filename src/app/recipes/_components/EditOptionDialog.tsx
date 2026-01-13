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
import { updateMenuOption } from '../_actions/updateMenuOption';
import { ImageUpload } from '@/components/ImageUpload';

type MenuOption = {
  option_id: number;
  option_name: string;
  option_category: 'edge' | 'topping' | 'beverage';
  additional_price: number;
  image_url?: string;
  is_active: boolean;
};

type EditOptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: MenuOption;
};

const categoryLabels: Record<string, string> = {
  edge: 'EDGE 옵션',
  topping: 'TOPPING 옵션',
  beverage: '음료',
};

export function EditOptionDialog({
  open,
  onOpenChange,
  option,
}: EditOptionDialogProps) {
  const [formData, setFormData] = React.useState({
    option_name: '',
    option_category: 'edge' as 'edge' | 'topping' | 'beverage',
    additional_price: 0,
    image_url: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && option) {
      setFormData({
        option_name: option.option_name,
        option_category: option.option_category,
        additional_price: option.additional_price,
        image_url: option.image_url || '',
        is_active: option.is_active,
      });
    }
  }, [open, option]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateMenuOption(option.option_id, formData);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>옵션 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="option_category">카테고리</Label>
            <Select
              value={formData.option_category}
              onValueChange={(value: 'edge' | 'topping' | 'beverage') =>
                setFormData({ ...formData, option_category: value })
              }
            >
              <SelectTrigger id="option_category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edge">{categoryLabels.edge}</SelectItem>
                <SelectItem value="topping">{categoryLabels.topping}</SelectItem>
                <SelectItem value="beverage">{categoryLabels.beverage}</SelectItem>
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

          {/* 활성화 상태 */}
          <div className="flex items-center space-x-2">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              활성화
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
