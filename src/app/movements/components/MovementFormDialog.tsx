'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MovementType, StockMovementInput } from '@/types';
import { createMovementAction } from '../actions';

type IngredientOption = {
  id: number;
  name: string;
  unit: string;
};

type MovementFormDialogProps = {
  ingredients: IngredientOption[];
  defaultType?: MovementType;
};

export function MovementFormDialog({
  ingredients,
  defaultType,
}: MovementFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<{
    ingredient_id: number | null;
    movement_type: MovementType;
    quantity: string;
    unit_price: string;
    reason: string;
    supplier: string;
    reference_no: string;
    note: string;
  }>({
    ingredient_id: null,
    movement_type: defaultType || 'in',
    quantity: '',
    unit_price: '',
    reason: '',
    supplier: '',
    reference_no: '',
    note: '',
  });

  const selectedIngredient = ingredients.find(
    (i) => i.id === formData.ingredient_id,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.ingredient_id) {
      setError('재료를 선택해주세요.');
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('수량을 입력해주세요.');
      return;
    }

    setLoading(true);

    const input: StockMovementInput = {
      ingredient_id: formData.ingredient_id,
      movement_type: formData.movement_type,
      quantity: Number(formData.quantity),
      unit_price: formData.unit_price ? Number(formData.unit_price) : undefined,
      reason: formData.reason || undefined,
      supplier: formData.supplier || undefined,
      reference_no: formData.reference_no || undefined,
      note: formData.note || undefined,
    };

    const result = await createMovementAction(input);

    setLoading(false);

    if (result.success) {
      setOpen(false);
      setFormData({
        ingredient_id: null,
        movement_type: defaultType || 'in',
        quantity: '',
        unit_price: '',
        reason: '',
        supplier: '',
        reference_no: '',
        note: '',
      });
      router.refresh();
    } else {
      setError(result.error || '등록에 실패했습니다.');
    }
  };

  const movementTypes: { value: MovementType; label: string }[] = [
    { value: 'in', label: '입고' },
    { value: 'out', label: '출고' },
    { value: 'waste', label: '폐기' },
    { value: 'adjustment', label: '조정' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          재고 이동 등록
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>재고 이동 등록</DialogTitle>
            <DialogDescription>
              입고, 출고, 폐기, 조정 내역을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {error && (
              <div className='text-sm text-red-600 bg-red-50 p-3 rounded-md'>
                {error}
              </div>
            )}

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='movement_type' className='text-right'>
                유형 *
              </Label>
              <Select
                value={formData.movement_type}
                onValueChange={(value: MovementType) =>
                  setFormData({ ...formData, movement_type: value })
                }
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='유형 선택' />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='ingredient' className='text-right'>
                재료 *
              </Label>
              <Select
                value={formData.ingredient_id?.toString() || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, ingredient_id: Number(value) })
                }
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='재료 선택' />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ingredient) => (
                    <SelectItem
                      key={ingredient.id}
                      value={ingredient.id.toString()}
                    >
                      {ingredient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='quantity' className='text-right'>
                수량 *
              </Label>
              <div className='col-span-3 flex gap-2 items-center'>
                <Input
                  id='quantity'
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='0'
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className='flex-1'
                />
                <span className='text-sm text-muted-foreground w-16'>
                  {selectedIngredient?.unit || '단위'}
                </span>
              </div>
            </div>

            {formData.movement_type === 'in' && (
              <>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='unit_price' className='text-right'>
                    단가
                  </Label>
                  <Input
                    id='unit_price'
                    type='number'
                    min='0'
                    placeholder='0'
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_price: e.target.value })
                    }
                    className='col-span-3'
                  />
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='supplier' className='text-right'>
                    공급처
                  </Label>
                  <Input
                    id='supplier'
                    placeholder='공급처명'
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className='col-span-3'
                  />
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='reference_no' className='text-right'>
                    참조번호
                  </Label>
                  <Input
                    id='reference_no'
                    placeholder='송장번호, 주문번호 등'
                    value={formData.reference_no}
                    onChange={(e) =>
                      setFormData({ ...formData, reference_no: e.target.value })
                    }
                    className='col-span-3'
                  />
                </div>
              </>
            )}

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='reason' className='text-right'>
                사유
              </Label>
              <Input
                id='reason'
                placeholder={
                  formData.movement_type === 'out'
                    ? '판매, 조리 등'
                    : formData.movement_type === 'waste'
                      ? '유통기한 만료, 파손 등'
                      : '사유 입력'
                }
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className='col-span-3'
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='note' className='text-right'>
                비고
              </Label>
              <Textarea
                id='note'
                placeholder='추가 메모'
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className='col-span-3'
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
