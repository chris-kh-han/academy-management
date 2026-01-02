'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';

export type ColumnMapping = {
  date_column: string;
  menu_name_column: string;
  quantity_column: string;
  price_column: string;
  total_column: string;
  transaction_id_column: string;
};

type ColumnMappingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  csvHeaders: string[];
  sampleRow: string[];
  savedMapping?: ColumnMapping | null;
  onConfirm: (mapping: ColumnMapping) => void;
};

// 시스템 필드 정의
const SYSTEM_FIELDS = [
  {
    key: 'date_column',
    label: '판매일시',
    required: true,
    example: '2025-01-02 14:30:25',
  },
  {
    key: 'menu_name_column',
    label: '메뉴명',
    required: true,
    example: '치즈피자',
  },
  { key: 'quantity_column', label: '판매수량', required: true, example: '5' },
  { key: 'price_column', label: '단가', required: false, example: '16000' },
  { key: 'total_column', label: '총액', required: false, example: '80000' },
  {
    key: 'transaction_id_column',
    label: '거래ID',
    required: false,
    example: 'TXN001',
  },
] as const;

// 자동 매핑 시도
function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  const headerLower = headers.map((h) => h.toLowerCase().replace(/\s/g, ''));

  headers.forEach((header, index) => {
    const h = headerLower[index];

    // 날짜/일시 컬럼 감지
    if (
      h.includes('일시') ||
      h.includes('날짜') ||
      h.includes('date') ||
      h.includes('일자') ||
      h.includes('sold') ||
      h.includes('time')
    ) {
      if (!mapping.date_column) mapping.date_column = header;
    }
    // 메뉴명 컬럼 감지
    else if (
      h.includes('메뉴') ||
      h.includes('menu') ||
      h.includes('상품') ||
      h.includes('품목') ||
      h.includes('product') ||
      h.includes('item')
    ) {
      if (!h.includes('id') && !mapping.menu_name_column)
        mapping.menu_name_column = header;
    }
    // 수량 컬럼 감지
    else if (
      h.includes('수량') ||
      h.includes('qty') ||
      h.includes('quantity') ||
      h.includes('count')
    ) {
      if (!mapping.quantity_column) mapping.quantity_column = header;
    }
    // 단가 컬럼 감지
    else if (h.includes('단가') || h.includes('price') || h.includes('가격')) {
      if (!h.includes('총') && !mapping.price_column)
        mapping.price_column = header;
    }
    // 총액 컬럼 감지
    else if (
      h.includes('총액') ||
      h.includes('total') ||
      h.includes('합계') ||
      h.includes('amount')
    ) {
      if (!mapping.total_column) mapping.total_column = header;
    }
    // 거래ID 컬럼 감지
    else if (
      h.includes('거래') ||
      h.includes('주문') ||
      h.includes('transaction') ||
      h.includes('order') ||
      h.includes('receipt') ||
      h.includes('영수증')
    ) {
      if (!mapping.transaction_id_column) mapping.transaction_id_column = header;
    }
  });

  return mapping;
}

export function ColumnMappingDialog({
  open,
  onOpenChange,
  csvHeaders,
  sampleRow,
  savedMapping,
  onConfirm,
}: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});

  // 초기 매핑 설정 (저장된 매핑 또는 자동 감지)
  useEffect(() => {
    if (savedMapping) {
      // 저장된 매핑 중 현재 CSV 헤더에 존재하는 것만 적용
      const validatedMapping: Partial<ColumnMapping> = {};
      (Object.keys(savedMapping) as (keyof ColumnMapping)[]).forEach((key) => {
        const value = savedMapping[key];
        if (value && csvHeaders.includes(value)) {
          validatedMapping[key] = value;
        }
      });

      // 저장된 매핑으로 커버 안 되는 필드는 자동 감지로 보완
      const autoDetected = autoDetectMapping(csvHeaders);
      setMapping({ ...autoDetected, ...validatedMapping });
    } else {
      setMapping(autoDetectMapping(csvHeaders));
    }
  }, [csvHeaders, savedMapping]);

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === '__none__' ? undefined : value,
    }));
  };

  // 필수 필드 검증
  const isValid =
    mapping.date_column && mapping.menu_name_column && mapping.quantity_column;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(mapping as ColumnMapping);
    }
  };

  // 선택된 헤더의 샘플 값 가져오기
  const getSampleValue = (headerName?: string) => {
    if (!headerName) return '-';
    const index = csvHeaders.indexOf(headerName);
    return index >= 0 ? sampleRow[index] || '-' : '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[550px]'>
        <DialogHeader>
          <DialogTitle>컬럼 매핑 설정</DialogTitle>
          <DialogDescription>
            CSV 파일의 컬럼을 시스템 필드와 연결하세요.
            {savedMapping && (
              <span className='block mt-1 text-green-600 dark:text-green-400'>
                저장된 매핑이 적용되었습니다.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {SYSTEM_FIELDS.map((field) => {
            const currentValue = mapping[field.key as keyof ColumnMapping];
            const sampleValue = getSampleValue(currentValue);
            const isFieldSet = !!currentValue;

            return (
              <div
                key={field.key}
                className='grid grid-cols-[140px_1fr_100px] items-center gap-3'
              >
                <Label className='flex items-center gap-2'>
                  {field.required ? (
                    isFieldSet ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertCircle className='h-4 w-4 text-red-500' />
                    )
                  ) : (
                    <span className='w-4' />
                  )}
                  {field.label}
                  {field.required && <span className='text-red-500'>*</span>}
                </Label>

                <Select
                  value={currentValue || '__none__'}
                  onValueChange={(value) =>
                    updateMapping(field.key as keyof ColumnMapping, value)
                  }
                >
                  <SelectTrigger className='min-w-[120px]'>
                    <SelectValue placeholder='컬럼 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__none__'>선택 안 함</SelectItem>
                    {csvHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div
                  className='text-xs text-muted-foreground truncate'
                  title={sampleValue}
                >
                  예: {sampleValue}
                </div>
              </div>
            );
          })}
        </div>

        <div className='rounded-md bg-muted/50 p-3 text-sm text-muted-foreground space-y-3'>
          <div>
            <p className='font-medium mb-1'>사용 방법</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>드롭다운에는 업로드한 CSV의 첫 번째 행(헤더)이 표시됩니다</li>
              <li>각 시스템 필드에 해당하는 CSV 컬럼을 선택하세요</li>
            </ul>
          </div>

          <div>
            <p className='font-medium mb-1'>필드 설명</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li><strong>판매일시*</strong>: 판매 날짜+시간 (예: 2025-01-02 14:30:25)</li>
              <li><strong>메뉴명*</strong>: 판매된 메뉴/상품 이름</li>
              <li><strong>판매수량*</strong>: 해당 메뉴의 판매 개수</li>
              <li><strong>단가</strong>: 메뉴 1개당 가격 (없으면 기존 메뉴 가격 사용)</li>
              <li><strong>총액</strong>: 판매 총액 (없으면 단가 × 수량으로 자동 계산)</li>
              <li><strong>거래ID</strong>: 주문번호/영수증번호 (선택 사항)</li>
            </ul>
          </div>

          <div>
            <p className='font-medium mb-1'>중복 방지</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li><strong className='text-green-600 dark:text-green-400'>시간이 포함된 경우</strong>: 같은 CSV를 여러 번 업로드해도 중복 저장되지 않습니다</li>
              <li><strong className='text-amber-600 dark:text-amber-400'>날짜만 있는 경우</strong>: 같은 날짜의 동일 메뉴는 덮어쓰기됩니다</li>
            </ul>
          </div>

          <div>
            <p className='font-medium mb-1'>참고사항</p>
            <ul className='list-disc list-inside space-y-1 text-xs'>
              <li>새 메뉴는 자동으로 생성됩니다</li>
              <li>매핑 설정은 저장되어 다음 업로드에 자동 적용됩니다</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            매핑 적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
