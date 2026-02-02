'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useBranch } from '@/contexts/BranchContext';
import { createOrderAction } from '../actions';

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  price: number;
  current_qty: number;
  reorder_point: number | null;
};

type Recommendation = {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  current_qty: number;
  reorder_point: number;
  recommended_qty: number;
  supplier?: string;
};

type OrderItem = {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
};

type CreateOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: Ingredient[];
  initialIngredients?: string[];
  recommendations?: Recommendation[];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

export function CreateOrderDialog({
  open,
  onOpenChange,
  ingredients,
  initialIngredients = [],
  recommendations = [],
}: CreateOrderDialogProps) {
  const { currentBranch } = useBranch();
  const [isLoading, setIsLoading] = React.useState(false);

  const [supplier, setSupplier] = React.useState('');
  const [expectedDate, setExpectedDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [selectedIngredient, setSelectedIngredient] = React.useState('');

  // 추천 품목으로 초기화
  React.useEffect(() => {
    if (open && initialIngredients.length > 0) {
      const initialItems: OrderItem[] = initialIngredients
        .map((id) => {
          const rec = recommendations.find((r) => r.ingredient_id === id);
          const ing = ingredients.find((i) => i.id === id);
          if (!rec || !ing) return null;

          return {
            ingredient_id: id,
            ingredient_name: rec.ingredient_name,
            unit: rec.unit,
            quantity: rec.recommended_qty,
            unit_price: ing.price,
          };
        })
        .filter((item): item is OrderItem => item !== null);

      setItems(initialItems);

      // 첫 번째 추천의 공급처 설정
      const firstRec = recommendations.find(
        (r) => r.ingredient_id === initialIngredients[0],
      );
      if (firstRec?.supplier) {
        setSupplier(firstRec.supplier);
      }
    }
  }, [open, initialIngredients, recommendations, ingredients]);

  // 다이얼로그 닫힐 때 초기화
  React.useEffect(() => {
    if (!open) {
      setSupplier('');
      setExpectedDate('');
      setNotes('');
      setItems([]);
      setSelectedIngredient('');
    }
  }, [open]);

  const handleAddItem = () => {
    if (!selectedIngredient) return;

    const ing = ingredients.find((i) => i.id === selectedIngredient);
    if (!ing) return;

    // 이미 추가된 품목인지 확인
    if (items.some((item) => item.ingredient_id === selectedIngredient)) {
      toast.warning('이미 추가된 품목입니다.');
      return;
    }

    setItems([
      ...items,
      {
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        unit: ing.unit,
        quantity: 1,
        unit_price: ing.price,
      },
    ]);
    setSelectedIngredient('');
  };

  const handleRemoveItem = (ingredientId: string) => {
    setItems(items.filter((item) => item.ingredient_id !== ingredientId));
  };

  const handleQuantityChange = (ingredientId: string, quantity: number) => {
    setItems(
      items.map((item) =>
        item.ingredient_id === ingredientId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item,
      ),
    );
  };

  const handlePriceChange = (ingredientId: string, price: number) => {
    setItems(
      items.map((item) =>
        item.ingredient_id === ingredientId
          ? { ...item, unit_price: Math.max(0, price) }
          : item,
      ),
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.warning('발주 품목을 추가해주세요.');
      return;
    }

    if (!currentBranch?.id) {
      toast.error('지점 정보를 찾을 수 없습니다.');
      return;
    }

    setIsLoading(true);
    const result = await createOrderAction({
      supplier: supplier || undefined,
      expected_date: expectedDate || undefined,
      notes: notes || undefined,
      branch_id: currentBranch.id,
      items: items.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
    setIsLoading(false);

    if (result.success) {
      toast.success('발주서가 생성되었습니다.');
      onOpenChange(false);
    } else {
      toast.error(result.error || '발주서 생성에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>발주서 작성</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* 기본 정보 */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='supplier'>공급처</Label>
              <Input
                id='supplier'
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder='공급처명 입력'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='expectedDate'>입고예정일</Label>
              <Input
                id='expectedDate'
                type='date'
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* 품목 추가 */}
          <div className='space-y-2'>
            <Label>품목 추가</Label>
            <div className='flex gap-2'>
              <Select
                value={selectedIngredient}
                onValueChange={setSelectedIngredient}
              >
                <SelectTrigger className='flex-1'>
                  <SelectValue placeholder='품목 선택' />
                </SelectTrigger>
                <SelectContent>
                  {ingredients
                    .filter(
                      (ing) =>
                        !items.some((item) => item.ingredient_id === ing.id),
                    )
                    .map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type='button'
                variant='outline'
                onClick={handleAddItem}
                disabled={!selectedIngredient}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* 품목 목록 */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>품목명</TableHead>
                  <TableHead className='w-[120px]'>수량</TableHead>
                  <TableHead className='w-[120px]'>단가</TableHead>
                  <TableHead className='text-right w-[120px]'>금액</TableHead>
                  <TableHead className='w-[50px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.ingredient_id}>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{item.ingredient_name}</p>
                          <p className='text-xs text-muted-foreground'>
                            {item.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min='0'
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.ingredient_id,
                              Number(e.target.value),
                            )
                          }
                          className='w-full'
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min='0'
                          value={item.unit_price}
                          onChange={(e) =>
                            handlePriceChange(
                              item.ingredient_id,
                              Number(e.target.value),
                            )
                          }
                          className='w-full'
                        />
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleRemoveItem(item.ingredient_id)}
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='h-24 text-center text-muted-foreground'
                    >
                      품목을 추가해주세요.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 합계 */}
          {items.length > 0 && (
            <div className='flex justify-end'>
              <div className='bg-muted rounded-lg px-6 py-3'>
                <span className='text-sm text-muted-foreground mr-4'>
                  총 {items.length}개 품목
                </span>
                <span className='text-lg font-bold'>
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}

          {/* 비고 */}
          <div className='space-y-2'>
            <Label htmlFor='notes'>비고</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='비고 입력 (선택)'
              rows={2}
            />
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '생성 중...' : '발주서 생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
