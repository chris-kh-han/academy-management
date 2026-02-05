'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ScanLine,
  Upload,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  X,
  Sparkles,
  ArrowLeft,
  Check,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import {
  bulkCreateStockMovementsAction,
  createIngredientAction,
} from '../actions';
import { useBranch } from '@/contexts/BranchContext';

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
  current_qty: number;
};

type StockItem = {
  id: string;
  name: string; // 품명및규격 (파싱 결과)
  ingredient_id: string; // 매칭된 재료 ID
  box: string; // BOX 수량
  ea: string; // EA 수량
  quantity: string; // 총수량
  unit_price: string; // 단가
  total_price: string; // 금액
  note: string; // 비고
};

type InvoiceScanDialogProps = {
  ingredients: IngredientOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

// 천 단위 콤마 포맷팅 (표시용)
const formatNumberWithComma = (value: string): string => {
  if (!value) return '';
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  return num.toLocaleString('ko-KR');
};

// 콤마 제거 (저장용)
const parseNumberValue = (value: string): string => {
  return value.replace(/,/g, '');
};

export function InvoiceScanDialog({
  ingredients,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: InvoiceScanDialogProps) {
  const router = useRouter();
  const { currentBranch } = useBranch();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled && onOpenChange ? onOpenChange : setInternalOpen;

  // 상태
  const [step, setStep] = React.useState<'input' | 'review'>('input');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showParseConfirm, setShowParseConfirm] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [supplier, setSupplier] = React.useState('');
  const [referenceNo, setReferenceNo] = React.useState('');
  const [note, setNote] = React.useState('');
  const [transactionDate, setTransactionDate] = React.useState(
    new Date().toISOString().split('T')[0],
  );
  const [stockItems, setStockItems] = React.useState<StockItem[]>([]);
  const [showImageRef, setShowImageRef] = React.useState(false); // 원본 이미지 참조 패널

  // 다이얼로그 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!open) {
      setStep('input');
      setImagePreview(null);
      setImageFile(null);
      setSupplier('');
      setReferenceNo('');
      setNote('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setStockItems([]);
    }
  }, [open]);

  // 파일 선택 처리 (미리보기만, OCR은 별도)
  const handleFileSelect = (file: File) => {
    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(
        '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 지원)',
      );
      return;
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('파일 크기가 너무 큽니다. (최대 10MB)');
      return;
    }

    // 파일 저장
    setImageFile(file);

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // OCR 스캔 + 자동 파싱 (Gemini Vision으로 한번에 처리)
  const handleScanAndParse = async () => {
    if (!imageFile) {
      toast.error('이미지를 먼저 업로드해주세요.');
      return;
    }

    setIsScanning(true);

    try {
      // Gemini Vision API 호출 (OCR + 파싱 통합)
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/ocr/invoice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || '처리에 실패했습니다.');
        return;
      }

      if (result.items.length === 0) {
        toast.info('추출된 품목이 없습니다. 이미지를 확인해주세요.');
        return;
      }

      // 공급처 자동 설정
      if (result.supplier && !supplier) {
        setSupplier(result.supplier);
      }

      // 송장번호 자동 설정
      if (result.referenceNo && !referenceNo) {
        setReferenceNo(result.referenceNo);
      }

      // 추출된 항목을 stockItems로 변환
      const newStockItems: StockItem[] = result.items.map(
        (item: {
          name: string;
          box?: number;
          ea?: number;
          quantity: number;
          unit?: string;
          unit_price?: number;
          total_price?: number;
          note?: string;
        }) => {
          const matchedIngredient = matchIngredient(item.name);
          return {
            id: crypto.randomUUID(),
            name: item.name,
            ingredient_id: matchedIngredient?.id || '',
            box: item.box ? item.box.toString() : '',
            ea: item.ea ? item.ea.toString() : '',
            quantity: item.quantity.toString(),
            unit_price: item.unit_price ? item.unit_price.toString() : '',
            total_price: item.total_price ? item.total_price.toString() : '',
            note: item.note || '',
          };
        },
      );

      setStockItems(newStockItems);

      // 매칭 결과 통계
      const matchedCount = newStockItems.filter((i) => i.ingredient_id).length;
      const unmatchedCount = newStockItems.length - matchedCount;

      if (unmatchedCount > 0) {
        toast.info(
          `${result.items.length}개 품목 추출 (${matchedCount}개 자동매칭, ${unmatchedCount}개 수동선택 필요)`,
        );
      } else {
        toast.success(`${result.items.length}개 품목 자동 입력 완료`);
      }

      // 사용량 정보 표시
      if (result.usage) {
        const { daily } = result.usage;
        if (daily.current >= daily.limit * 0.8) {
          toast.warning(`일일 API 사용량: ${daily.current}/${daily.limit}`);
        }
      }
    } catch (error) {
      console.error('Scan and parse error:', error);
      toast.error('처리 중 오류가 발생했습니다.');
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
      {
        id: crypto.randomUUID(),
        name: '',
        ingredient_id: '',
        box: '',
        ea: '',
        quantity: '',
        unit_price: '',
        total_price: '',
        note: '',
      },
    ]);
  };

  const removeStockItem = (id: string) => {
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
    // 유효성 검사: 수량만 있으면 유효 (ingredient_id 없어도 OK - 나중에 생성)
    const itemsToProcess = stockItems.filter(
      (item) => item.quantity && Number(item.quantity) > 0,
    );

    if (itemsToProcess.length === 0) {
      toast.error('입고할 항목을 1개 이상 입력해주세요.');
      return;
    }

    if (!currentBranch?.id) {
      toast.error('지점 정보를 확인할 수 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. 매칭 안 된 항목들 새 재료로 생성
      const unmatchedItems = itemsToProcess.filter(
        (item) => !item.ingredient_id,
      );

      for (const item of unmatchedItems) {
        const result = await createIngredientAction({
          ingredient_name: item.name,
          unit: 'ea', // 기본 단위
          branch_id: currentBranch.id,
        });

        if (result.success && result.data?.id) {
          // 생성된 재료 ID로 업데이트
          item.ingredient_id = String(result.data.id);
        } else {
          toast.error(`재료 생성 실패: ${item.name}`);
          setIsSaving(false);
          return;
        }
      }

      // 2. 기존 입고 로직 실행
      const items = itemsToProcess.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity: Number(item.quantity),
        unit_price: item.unit_price ? Number(item.unit_price) : undefined,
      }));

      const commonData = {
        supplier: supplier || undefined,
        reference_no: referenceNo || undefined,
        note: note || undefined,
        transaction_date: transactionDate || undefined,
      };

      const result = await bulkCreateStockMovementsAction(items, commonData);

      if (result.success) {
        const newIngredientMsg =
          unmatchedItems.length > 0
            ? ` (신규 재료 ${unmatchedItems.length}개 등록)`
            : '';
        toast.success(
          `${result.processed}개 항목 입고 완료${newIngredientMsg}`,
        );
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
  const getIngredient = React.useCallback(
    (id: string) => ingredients.find((i) => i.id === id),
    [ingredients],
  );

  // 재료명 fuzzy matching
  const matchIngredient = React.useCallback(
    (parsedName: string): IngredientOption | undefined => {
      const normalizedParsed = parsedName.toLowerCase().trim();

      // 1. 정확히 일치
      const exactMatch = ingredients.find(
        (ing) => ing.name.toLowerCase() === normalizedParsed,
      );
      if (exactMatch) return exactMatch;

      // 2. 포함 관계 (양방향)
      const partialMatch = ingredients.find(
        (ing) =>
          ing.name.toLowerCase().includes(normalizedParsed) ||
          normalizedParsed.includes(ing.name.toLowerCase()),
      );
      if (partialMatch) return partialMatch;

      // 3. 공백/특수문자 제거 후 비교
      const cleanParsed = normalizedParsed.replace(/[^가-힣a-z0-9]/g, '');
      const cleanMatch = ingredients.find((ing) => {
        const cleanName = ing.name.toLowerCase().replace(/[^가-힣a-z0-9]/g, '');
        return (
          cleanName.includes(cleanParsed) || cleanParsed.includes(cleanName)
        );
      });
      if (cleanMatch) return cleanMatch;

      return undefined;
    },
    [ingredients],
  );

  // 유효한 항목 수 및 리스트: 수량만 있으면 유효 (ingredient_id 없어도 OK - 신규 등록 예정)
  const validItems = React.useMemo(
    () =>
      stockItems.filter((item) => item.quantity && Number(item.quantity) > 0),
    [stockItems],
  );
  const validItemCount = validItems.length;

  // 합계 금액 계산
  const totalAmount = React.useMemo(
    () =>
      validItems.reduce((sum, item) => {
        const price = item.total_price
          ? Number(item.total_price)
          : item.quantity && item.unit_price
            ? Number(item.quantity) * Number(item.unit_price)
            : 0;
        return sum + price;
      }, 0),
    [validItems],
  );

  return (
    <>
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
        <DialogContent className='flex h-full max-w-none flex-col sm:inset-0 sm:h-full sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-none'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ScanLine className='h-5 w-5' />
              거래명세서 스캔
              {step === 'review' && (
                <span className='bg-primary/10 text-primary rounded-md px-2 py-0.5 text-sm font-normal'>
                  입고 확인
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {step === 'input'
                ? '거래명세서 이미지를 업로드하면 OCR로 텍스트를 추출합니다. 추출된 텍스트를 참고하여 오른쪽에서 입고 항목을 입력하세요.'
                : '아래 내용을 확인한 후 최종 입고 버튼을 눌러주세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className='flex w-full flex-1 overflow-hidden py-4'>
            {step === 'input' ? (
              <div className='flex h-full w-full flex-col gap-4'>
                {/* ===== 상단: 이미지 업로드 ===== */}
                <div
                  className='flex w-full shrink-0'
                  style={{ height: '280px' }}
                >
                  {/* 이미지 업로드 영역 */}
                  <div className='flex h-full w-full flex-col'>
                    <Label className='mb-2 shrink-0 text-sm font-medium'>
                      거래명세서 이미지
                    </Label>
                    {!imagePreview ? (
                      <div
                        className={`flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
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
                        <ImageIcon className='text-muted-foreground mb-3 h-12 w-12' />
                        <p className='text-muted-foreground mb-3 text-sm'>
                          거래명세서 이미지를 드래그하거나
                        </p>
                        <Button
                          variant='outline'
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isScanning}
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              스캔 중...
                            </>
                          ) : (
                            <>
                              <Upload className='mr-2 h-4 w-4' />
                              파일 선택
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className='relative flex h-full flex-col'>
                        <div className='relative min-h-0 flex-1'>
                          <Image
                            src={imagePreview}
                            alt='업로드된 거래명세서 이미지 미리보기'
                            fill
                            className='rounded-lg object-contain'
                            unoptimized
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label='이미지 제거'
                            className='bg-background/80 hover:bg-background absolute top-1 right-1'
                            onClick={() => {
                              setImagePreview(null);
                              setImageFile(null);
                            }}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                          {isScanning && (
                            <div className='bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg'>
                              <div className='flex items-center gap-2 text-sm'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                이미지 분석 중...
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant='secondary'
                          onClick={() => setShowParseConfirm(true)}
                          disabled={isScanning || !imageFile}
                          className='mt-2 w-full'
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              분석 중...
                            </>
                          ) : (
                            <>
                              <Sparkles className='mr-2 h-4 w-4' />
                              자동 입력
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ===== 하단: 공급처/비고 + 입고항목 ===== */}
                <div className='flex min-h-0 w-full flex-1 flex-col gap-4'>
                  {/* 공통 정보 (가로 4열) */}
                  <div className='grid shrink-0 grid-cols-4 gap-3'>
                    <div>
                      <Label htmlFor='transaction_date' className='text-sm'>
                        거래일자
                      </Label>
                      <Input
                        id='transaction_date'
                        type='date'
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className='mt-1'
                      />
                    </div>
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
                    <div>
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
                  </div>

                  {/* 입고 항목 테이블 */}
                  <div className='flex min-h-0 flex-1 flex-col'>
                    <div className='mb-3 flex shrink-0 items-center justify-between'>
                      <Label className='text-sm font-semibold'>입고 항목</Label>
                      <div className='flex items-center gap-2'>
                        {imagePreview && (
                          <Button
                            variant={showImageRef ? 'secondary' : 'outline'}
                            size='sm'
                            onClick={() => setShowImageRef(!showImageRef)}
                            className='h-8 gap-1.5 px-3 text-xs'
                          >
                            <ImageIcon className='h-3.5 w-3.5' />
                            {showImageRef ? '이미지 숨기기' : '원본 참조'}
                          </Button>
                        )}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={addStockItem}
                          className='h-8 gap-1.5 px-3 text-xs'
                        >
                          <Plus className='h-3.5 w-3.5' />행 추가
                        </Button>
                      </div>
                    </div>
                    <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-auto'>
                      {/* 원본 이미지 참조 패널 */}
                      {showImageRef && imagePreview && (
                        <div className='flex flex-col rounded-lg border'>
                          <div className='bg-muted/30 border-b px-3 py-2 text-xs font-medium'>
                            원본 이미지
                          </div>
                          <div className='relative p-2'>
                            <Image
                              src={imagePreview}
                              alt='원본 거래명세서'
                              width={400}
                              height={600}
                              className='h-auto w-full object-contain'
                              unoptimized
                            />
                          </div>
                        </div>
                      )}
                      {/* 테이블 */}
                      <div className='rounded-lg border'>
                        {stockItems.length === 0 ? (
                          <div className='text-muted-foreground flex h-full items-center justify-center text-sm'>
                            OCR 텍스트를 자동 파싱하면 입고 항목이 표시됩니다
                          </div>
                        ) : (
                          <table className='w-full text-sm'>
                            <thead className='bg-muted/60 sticky top-0 z-10'>
                              <tr className='border-b'>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  #
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  품명및규격
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  재료매칭
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  BOX
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  EA
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  수량
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  단가
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  금액
                                </th>
                                <th className='px-2 py-2.5 text-left text-xs font-semibold'>
                                  비고
                                </th>
                                <th className='px-2 py-2.5'></th>
                              </tr>
                            </thead>
                            <tbody className='divide-y'>
                              {stockItems.map((item, index) => {
                                const selectedIngredient = getIngredient(
                                  item.ingredient_id,
                                );
                                return (
                                  <tr
                                    key={item.id}
                                    className='hover:bg-muted/40 transition-colors'
                                  >
                                    {/* # 번호 */}
                                    <td className='text-muted-foreground px-2 py-2 text-left text-xs'>
                                      {index + 1}
                                    </td>
                                    {/* 품명및규격 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        placeholder='품명'
                                        value={item.name}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'name',
                                            e.target.value,
                                          )
                                        }
                                        className='h-8 w-full text-xs'
                                      />
                                    </td>
                                    {/* 재료 매칭 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Select
                                        value={item.ingredient_id}
                                        onValueChange={(value) =>
                                          updateStockItem(
                                            item.id,
                                            'ingredient_id',
                                            value,
                                          )
                                        }
                                      >
                                        <SelectTrigger className='h-8 w-full text-xs'>
                                          <SelectValue placeholder='선택' />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ingredients.map((ing) => (
                                            <SelectItem
                                              key={ing.id}
                                              value={ing.id}
                                            >
                                              {ing.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {selectedIngredient ? (
                                        <p className='text-muted-foreground mt-0.5 truncate px-1 text-[10px]'>
                                          현재: {selectedIngredient.current_qty}{' '}
                                          {selectedIngredient.unit}
                                        </p>
                                      ) : item.name ? (
                                        <p className='mt-0.5 truncate px-1 text-[10px] text-amber-600'>
                                          🆕 신규 등록 예정
                                        </p>
                                      ) : null}
                                    </td>
                                    {/* BOX */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        type='text'
                                        inputMode='numeric'
                                        placeholder='-'
                                        value={formatNumberWithComma(item.box)}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'box',
                                            parseNumberValue(e.target.value),
                                          )
                                        }
                                        className='h-8 w-full text-left text-xs'
                                      />
                                    </td>
                                    {/* EA */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        type='text'
                                        inputMode='numeric'
                                        placeholder='-'
                                        value={formatNumberWithComma(item.ea)}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'ea',
                                            parseNumberValue(e.target.value),
                                          )
                                        }
                                        className='h-8 w-full text-left text-xs'
                                      />
                                    </td>
                                    {/* 수량 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        type='text'
                                        inputMode='decimal'
                                        placeholder='0'
                                        value={formatNumberWithComma(
                                          item.quantity,
                                        )}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'quantity',
                                            parseNumberValue(e.target.value),
                                          )
                                        }
                                        className='h-8 w-full text-left text-xs'
                                      />
                                    </td>
                                    {/* 단가 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        type='text'
                                        inputMode='decimal'
                                        placeholder='0'
                                        value={formatNumberWithComma(
                                          item.unit_price,
                                        )}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'unit_price',
                                            parseNumberValue(e.target.value),
                                          )
                                        }
                                        className='h-8 w-full text-left text-xs'
                                      />
                                    </td>
                                    {/* 금액 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        type='text'
                                        inputMode='decimal'
                                        placeholder='0'
                                        value={formatNumberWithComma(
                                          item.total_price,
                                        )}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'total_price',
                                            parseNumberValue(e.target.value),
                                          )
                                        }
                                        className='h-8 w-full text-left text-xs'
                                      />
                                    </td>
                                    {/* 비고 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Input
                                        placeholder='-'
                                        value={item.note}
                                        onChange={(e) =>
                                          updateStockItem(
                                            item.id,
                                            'note',
                                            e.target.value,
                                          )
                                        }
                                        className='h-8 w-full text-xs'
                                      />
                                    </td>
                                    {/* 삭제 버튼 */}
                                    <td className='px-1 py-1.5 text-left'>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        aria-label={`${item.name || `${index + 1}번`} 항목 삭제`}
                                        className='text-muted-foreground hover:text-destructive h-8 w-8'
                                        onClick={() => removeStockItem(item.id)}
                                      >
                                        <Trash2 className='h-4 w-4' />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 리뷰 스텝 */
              <div className='flex h-full w-full flex-col gap-6'>
                {/* 공통 정보 요약 */}
                <div className='bg-muted/30 w-full shrink-0 rounded-lg border p-4'>
                  <h3 className='mb-3 text-sm font-semibold'>공통 정보</h3>
                  <dl className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4'>
                    <div>
                      <dt className='text-muted-foreground'>거래일자</dt>
                      <dd className='font-medium'>{transactionDate || '-'}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>공급처</dt>
                      <dd className='font-medium'>{supplier || '-'}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>참조번호</dt>
                      <dd className='font-medium'>{referenceNo || '-'}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>비고</dt>
                      <dd className='font-medium'>{note || '-'}</dd>
                    </div>
                  </dl>
                </div>

                {/* 입고 항목 요약 */}
                <div className='flex min-h-0 w-full flex-1 flex-col overflow-hidden'>
                  <h3 className='mb-3 shrink-0 text-sm font-semibold'>
                    입고 항목 ({validItemCount}개)
                  </h3>
                  <div className='flex-1 overflow-auto rounded-md border'>
                    <table className='w-full table-fixed text-sm'>
                      <colgroup>
                        <col className='w-10' />
                        <col />
                        <col className='w-24' />
                        <col className='w-28' />
                        <col className='w-32' />
                      </colgroup>
                      <thead className='bg-muted/50 sticky top-0'>
                        <tr>
                          <th className='p-2 text-center font-medium'>#</th>
                          <th className='p-2 text-left font-medium'>재료명</th>
                          <th className='p-2 text-right font-medium'>수량</th>
                          <th className='p-2 text-right font-medium'>단가</th>
                          <th className='p-2 text-right font-medium'>금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validItems.map((item, index) => {
                          const ingredient = getIngredient(item.ingredient_id);
                          const price = item.total_price
                            ? Number(item.total_price)
                            : item.quantity && item.unit_price
                              ? Number(item.quantity) * Number(item.unit_price)
                              : 0;
                          return (
                            <tr
                              key={item.id}
                              className='border-b last:border-b-0'
                            >
                              <td className='text-muted-foreground p-2 text-center'>
                                {index + 1}
                              </td>
                              <td className='p-2'>
                                {ingredient ? (
                                  <>
                                    <span className='font-medium'>
                                      {ingredient.name}
                                    </span>
                                    {item.name &&
                                      item.name !== ingredient.name && (
                                        <span className='text-muted-foreground ml-2 text-xs'>
                                          ({item.name})
                                        </span>
                                      )}
                                  </>
                                ) : (
                                  <span className='font-medium text-amber-600'>
                                    🆕 {item.name || '-'} (신규)
                                  </span>
                                )}
                              </td>
                              <td className='p-2 text-right'>
                                {Number(item.quantity).toLocaleString()}{' '}
                                <span className='text-muted-foreground text-xs'>
                                  {ingredient?.unit || 'ea'}
                                </span>
                              </td>
                              <td className='p-2 text-right'>
                                {item.unit_price
                                  ? `${Number(item.unit_price).toLocaleString()}원`
                                  : '-'}
                              </td>
                              <td className='p-2 text-right font-medium'>
                                {price > 0
                                  ? `${price.toLocaleString()}원`
                                  : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className='bg-muted/30 font-medium'>
                        <tr>
                          <td colSpan={4} className='p-2 text-right'>
                            합계
                          </td>
                          <td className='p-2 text-right text-base'>
                            {totalAmount.toLocaleString()}원
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='gap-3'>
            {step === 'input' ? (
              <>
                <Button variant='outline' onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={() => setStep('review')}
                  disabled={validItemCount === 0}
                >
                  <Check className='mr-2 h-4 w-4' />
                  입고 확인 ({validItemCount}개)
                </Button>
              </>
            ) : (
              <>
                <Button variant='outline' onClick={() => setStep('input')}>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  뒤로
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      최종 입고
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 파싱 확인 모달 */}
      <AlertDialog open={showParseConfirm} onOpenChange={setShowParseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>자동 입력 실행</AlertDialogTitle>
            <AlertDialogDescription>
              이미지를 스캔하고 입고 항목을 자동으로 추출합니다.
              <br />
              API 사용량이 차감됩니다. 진행하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowParseConfirm(false);
                handleScanAndParse();
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
