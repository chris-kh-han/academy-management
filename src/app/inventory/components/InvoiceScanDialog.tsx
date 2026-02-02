'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ScanLine,
  Upload,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  X,
} from 'lucide-react';
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
import { toast } from 'react-toastify';
import { bulkCreateStockMovementsAction } from '../actions';

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  current_qty: number;
};

type StockItem = {
  id: string;
  ingredient_id: string;
  quantity: string;
  unit_price: string;
};

type InvoiceScanDialogProps = {
  ingredients: IngredientOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function InvoiceScanDialog({
  ingredients,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: InvoiceScanDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // 상태
  const [isDragging, setIsDragging] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [ocrText, setOcrText] = React.useState<string>('');
  const [supplier, setSupplier] = React.useState('');
  const [referenceNo, setReferenceNo] = React.useState('');
  const [note, setNote] = React.useState('');
  const [stockItems, setStockItems] = React.useState<StockItem[]>([
    { id: crypto.randomUUID(), ingredient_id: '', quantity: '', unit_price: '' },
  ]);

  // 다이얼로그 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!open) {
      setImagePreview(null);
      setOcrText('');
      setSupplier('');
      setReferenceNo('');
      setNote('');
      setStockItems([
        { id: crypto.randomUUID(), ingredient_id: '', quantity: '', unit_price: '' },
      ]);
    }
  }, [open]);

  // 파일 선택 처리
  const handleFileSelect = async (file: File) => {
    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 지원)');
      return;
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('파일 크기가 너무 큽니다. (최대 10MB)');
      return;
    }

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // OCR 처리
    setIsScanning(true);
    setOcrText('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr/invoice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setOcrText(result.text || '');
        if (!result.text) {
          toast.info('이미지에서 텍스트를 찾을 수 없습니다.');
        }
      } else {
        toast.error(result.error || 'OCR 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('OCR 처리 중 오류가 발생했습니다.');
    } finally {
      setIsScanning(false);
    }
  };

  // 드래그 앤 드롭
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 입고 항목 관리
  const addStockItem = () => {
    setStockItems([
      ...stockItems,
      { id: crypto.randomUUID(), ingredient_id: '', quantity: '', unit_price: '' },
    ]);
  };

  const removeStockItem = (id: string) => {
    if (stockItems.length <= 1) return;
    setStockItems(stockItems.filter((item) => item.id !== id));
  };

  const updateStockItem = (
    id: string,
    field: keyof StockItem,
    value: string,
  ) => {
    setStockItems(
      stockItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  // 입고 처리
  const handleSubmit = async () => {
    // 유효성 검사
    const validItems = stockItems.filter(
      (item) => item.ingredient_id && item.quantity && Number(item.quantity) > 0,
    );

    if (validItems.length === 0) {
      toast.error('입고할 항목을 1개 이상 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const items = validItems.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: Number(item.quantity),
        unit_price: item.unit_price ? Number(item.unit_price) : undefined,
      }));

      const commonData = {
        supplier: supplier || undefined,
        reference_no: referenceNo || undefined,
        note: note || undefined,
      };

      const result = await bulkCreateStockMovementsAction(items, commonData);

      if (result.success) {
        toast.success(`${result.processed}개 항목 입고 완료`);
        setOpen(false);
        router.refresh();
      } else {
        if (result.errors.length > 0) {
          toast.error(
            `${result.processed}개 성공, ${result.failed}개 실패: ${result.errors[0]}`,
          );
        } else {
          toast.error('입고 처리에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('입고 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 재료 찾기
  const getIngredient = (id: string) => ingredients.find((i) => i.id === id);

  // 유효한 항목 수
  const validItemCount = stockItems.filter(
    (item) => item.ingredient_id && item.quantity && Number(item.quantity) > 0,
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined &&
        (trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button variant='outline'>
              <ScanLine className='mr-2 h-4 w-4' />
              거래명세서 스캔
            </Button>
          </DialogTrigger>
        ))}
      <DialogContent className='w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-[900px] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ScanLine className='h-5 w-5' />
            거래명세서 스캔
          </DialogTitle>
          <DialogDescription>
            거래명세서 이미지를 업로드하면 OCR로 텍스트를 추출합니다. 추출된 텍스트를
            참고하여 오른쪽에서 입고 항목을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-hidden py-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 h-full'>
            {/* 왼쪽: 이미지 업로드 + OCR 텍스트 */}
            <div className='flex flex-col gap-4 min-h-0'>
              {/* 이미지 업로드 영역 */}
              {!imagePreview ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors flex-shrink-0 ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/webp,image/gif'
                    onChange={handleInputChange}
                    className='hidden'
                  />
                  <ImageIcon className='h-10 w-10 mx-auto text-muted-foreground mb-3' />
                  <p className='text-sm text-muted-foreground mb-2'>
                    이미지를 드래그하거나
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        스캔 중...
                      </>
                    ) : (
                      <>
                        <Upload className='h-4 w-4 mr-2' />
                        파일 선택
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className='relative flex-shrink-0'>
                  <img
                    src={imagePreview}
                    alt='거래명세서'
                    className='max-h-[180px] w-auto mx-auto rounded-lg object-contain'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute top-1 right-1 bg-background/80 hover:bg-background'
                    onClick={() => {
                      setImagePreview(null);
                      setOcrText('');
                    }}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                  {isScanning && (
                    <div className='absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg'>
                      <div className='flex items-center gap-2 text-sm'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        OCR 스캔 중...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OCR 텍스트 */}
              <div className='flex-1 min-h-0'>
                <Label className='text-sm font-medium mb-2 block'>
                  OCR 추출 텍스트
                </Label>
                <Textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder={
                    imagePreview
                      ? isScanning
                        ? '텍스트 추출 중...'
                        : ocrText
                          ? ''
                          : '텍스트를 찾을 수 없습니다. 다른 이미지를 시도해보세요.'
                      : '이미지를 업로드하면 여기에 텍스트가 표시됩니다.'
                  }
                  className='h-[200px] text-sm font-mono resize-none'
                  readOnly={isScanning}
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  위 텍스트를 참고하여 오른쪽에 입고 항목을 입력하세요
                </p>
              </div>
            </div>

            {/* 오른쪽: 입고 항목 입력 */}
            <div className='flex flex-col gap-4 min-h-0'>
              {/* 공통 정보 */}
              <div className='grid grid-cols-2 gap-3 flex-shrink-0'>
                <div>
                  <Label htmlFor='supplier' className='text-sm'>
                    공급처
                  </Label>
                  <Input
                    id='supplier'
                    placeholder='공급처명'
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className='mt-1'
                  />
                </div>
                <div>
                  <Label htmlFor='reference_no' className='text-sm'>
                    참조번호
                  </Label>
                  <Input
                    id='reference_no'
                    placeholder='송장/주문번호'
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className='mt-1'
                  />
                </div>
              </div>

              {/* 비고 */}
              <div className='flex-shrink-0'>
                <Label htmlFor='note' className='text-sm'>
                  비고
                </Label>
                <Input
                  id='note'
                  placeholder='추가 메모'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className='mt-1'
                />
              </div>

              {/* 입고 항목 목록 */}
              <div className='flex-1 min-h-0 overflow-hidden'>
                <div className='flex items-center justify-between mb-2'>
                  <Label className='text-sm font-medium'>입고 항목</Label>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={addStockItem}
                    className='h-7 px-2 text-xs'
                  >
                    <Plus className='h-3 w-3 mr-1' />
                    행 추가
                  </Button>
                </div>
                <div className='space-y-2 max-h-[250px] overflow-y-auto pr-1'>
                  {stockItems.map((item, index) => {
                    const selectedIngredient = getIngredient(item.ingredient_id);
                    return (
                      <div
                        key={item.id}
                        className='flex gap-2 items-start p-2 rounded-lg bg-muted/30'
                      >
                        <span className='text-xs text-muted-foreground pt-2 w-4'>
                          {index + 1}
                        </span>
                        <div className='flex-1 grid grid-cols-3 gap-2'>
                          {/* 재료 선택 */}
                          <div className='col-span-3 sm:col-span-1'>
                            <Select
                              value={item.ingredient_id}
                              onValueChange={(value) =>
                                updateStockItem(item.id, 'ingredient_id', value)
                              }
                            >
                              <SelectTrigger className='h-8 text-xs'>
                                <SelectValue placeholder='재료 선택' />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((ing) => (
                                  <SelectItem key={ing.id} value={ing.id}>
                                    {ing.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedIngredient && (
                              <p className='text-[10px] text-muted-foreground mt-0.5 px-1'>
                                현재: {selectedIngredient.current_qty}{' '}
                                {selectedIngredient.unit}
                              </p>
                            )}
                          </div>
                          {/* 수량 */}
                          <div>
                            <Input
                              type='number'
                              inputMode='decimal'
                              min='0'
                              step='0.01'
                              placeholder='수량'
                              value={item.quantity}
                              onChange={(e) =>
                                updateStockItem(item.id, 'quantity', e.target.value)
                              }
                              className='h-8 text-xs'
                            />
                          </div>
                          {/* 단가 */}
                          <div>
                            <Input
                              type='number'
                              inputMode='decimal'
                              min='0'
                              placeholder='단가'
                              value={item.unit_price}
                              onChange={(e) =>
                                updateStockItem(item.id, 'unit_price', e.target.value)
                              }
                              className='h-8 text-xs'
                            />
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 shrink-0'
                          onClick={() => removeStockItem(item.id)}
                          disabled={stockItems.length <= 1}
                        >
                          <Trash2 className='h-3.5 w-3.5 text-muted-foreground' />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || validItemCount === 0}>
            {isSaving ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                처리 중...
              </>
            ) : (
              <>
                <Upload className='h-4 w-4 mr-2' />
                {validItemCount > 0 ? `${validItemCount}개 입고 처리` : '입고 처리'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
