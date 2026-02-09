'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ImageUploader } from './ImageUploader';
import { OCRResultTable, type ScanItem } from './OCRResultTable';
import { SupplierSelector } from './SupplierSelector';
import { useBranch } from '@/contexts/BranchContext';
import { toast } from 'react-toastify';
import type { Supplier } from '@/types';

type IngredientOption = {
  id: string;
  ingredient_name: string;
  unit: string;
};

type ScanPageProps = {
  suppliers: Supplier[];
  ingredients: IngredientOption[];
};

export function ScanPage({ suppliers, ingredients }: ScanPageProps) {
  const router = useRouter();
  const { currentBranch } = useBranch();

  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showScanConfirm, setShowScanConfirm] = React.useState(false);

  const [supplierId, setSupplierId] = React.useState('none');
  const [newSupplierName, setNewSupplierName] = React.useState('');
  const [detectedSupplierName, setDetectedSupplierName] = React.useState<
    string | undefined
  >();
  const [invoiceNo, setInvoiceNo] = React.useState('');
  const [invoiceDate, setInvoiceDate] = React.useState(
    new Date().toISOString().split('T')[0],
  );
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<ScanItem[]>([]);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(
        '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP, GIF만 지원)',
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('파일 크기가 너무 큽니다. (최대 10MB)');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const matchIngredient = React.useCallback(
    (parsedName: string): IngredientOption | undefined => {
      const normalized = parsedName.toLowerCase().trim();

      const exact = ingredients.find(
        (ing) => ing.ingredient_name.toLowerCase() === normalized,
      );
      if (exact) return exact;

      const partial = ingredients.find(
        (ing) =>
          ing.ingredient_name.toLowerCase().includes(normalized) ||
          normalized.includes(ing.ingredient_name.toLowerCase()),
      );
      if (partial) return partial;

      const clean = normalized.replace(/[^가-힣a-z0-9]/g, '');
      const cleanMatch = ingredients.find((ing) => {
        const cleanName = ing.ingredient_name
          .toLowerCase()
          .replace(/[^가-힣a-z0-9]/g, '');
        return cleanName.includes(clean) || clean.includes(cleanName);
      });
      return cleanMatch;
    },
    [ingredients],
  );

  const handleScanAndParse = async () => {
    if (!imageFile) {
      toast.error('이미지를 먼저 업로드해주세요.');
      return;
    }

    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/ocr/invoice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'OCR 처리에 실패했습니다.');
        return;
      }

      if (result.items.length === 0) {
        toast.info('추출된 품목이 없습니다. 이미지를 확인해주세요.');
        return;
      }

      if (result.supplier) {
        setDetectedSupplierName(result.supplier);
      }

      if (result.referenceNo && !invoiceNo) {
        setInvoiceNo(result.referenceNo);
      }

      const newItems: ScanItem[] = result.items.map(
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
          const matched = matchIngredient(item.name);
          return {
            id: crypto.randomUUID(),
            name: item.name,
            ingredient_id: matched?.id ?? '',
            box: item.box ? item.box.toString() : '',
            ea: item.ea ? item.ea.toString() : '',
            quantity: item.quantity.toString(),
            unit: item.unit ?? matched?.unit ?? '',
            unit_price: item.unit_price ? item.unit_price.toString() : '',
            total_price: item.total_price ? item.total_price.toString() : '',
            note: item.note ?? '',
          };
        },
      );

      setItems(newItems);

      const matchedCount = newItems.filter((i) => i.ingredient_id).length;
      const unmatchedCount = newItems.length - matchedCount;

      if (unmatchedCount > 0) {
        toast.info(
          `${result.items.length}개 품목 추출 (${matchedCount}개 자동매칭, ${unmatchedCount}개 수동선택 필요)`,
        );
      } else {
        toast.success(`${result.items.length}개 품목 자동 입력 완료`);
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('스캔 중 오류가 발생했습니다.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleItemUpdate = (
    id: string,
    field: keyof ScanItem,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleItemAdd = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        ingredient_id: '',
        box: '',
        ea: '',
        quantity: '',
        unit: '',
        unit_price: '',
        total_price: '',
        note: '',
      },
    ]);
  };

  const handleItemRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    const validItems = items.filter(
      (item) => item.name && item.quantity && Number(item.quantity) > 0,
    );

    if (validItems.length === 0) {
      toast.error('저장할 품목을 1개 이상 입력해주세요.');
      return;
    }

    if (!currentBranch?.id) {
      toast.error('지점 정보를 확인할 수 없습니다.');
      return;
    }

    setIsSaving(true);

    try {
      // Determine supplier
      let finalSupplierId: string | null = null;

      if (supplierId !== 'none') {
        finalSupplierId = supplierId;
      } else if (newSupplierName.trim()) {
        // Create new supplier
        const { createSupplier } = await import('@/app/suppliers/actions');
        const result = await createSupplier(currentBranch.id, {
          name: newSupplierName.trim(),
        });
        if (result.success && result.data) {
          finalSupplierId = result.data.id;
        }
      }

      // Calculate total
      const totalAmount = validItems.reduce((sum, item) => {
        const price = item.total_price
          ? Number(item.total_price)
          : Number(item.quantity) * Number(item.unit_price || 0);
        return sum + price;
      }, 0);

      // Upload image to Supabase storage if available
      let imageUrl: string | null = null;
      if (imageFile) {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const fileName = `invoices/${currentBranch.id}/${Date.now()}-${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoice-images')
          .upload(fileName, imageFile);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('invoice-images')
            .getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      }

      // Create invoice via API
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          branch_id: currentBranch.id,
          supplier_id: finalSupplierId,
          invoice_no: invoiceNo || null,
          invoice_date: invoiceDate || null,
          status: 'received',
          delivery_status: 'pending',
          total_amount: totalAmount,
          confirmed_amount: 0,
          image_url: imageUrl,
          notes: notes || null,
        })
        .select()
        .single();

      if (invoiceError) {
        throw new Error(`명세서 생성 실패: ${invoiceError.message}`);
      }

      // Create invoice items
      const invoiceItems = validItems.map((item) => ({
        invoice_id: invoice.id,
        item_name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit || null,
        unit_price: Number(item.unit_price || 0),
        total_price: item.total_price
          ? Number(item.total_price)
          : Number(item.quantity) * Number(item.unit_price || 0),
        box_qty: item.box ? Number(item.box) : 0,
        ea_qty: item.ea ? Number(item.ea) : 0,
        matched_ingredient_id: item.ingredient_id || null,
        match_status: item.ingredient_id ? 'auto_matched' : 'unmatched',
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        throw new Error(`품목 생성 실패: ${itemsError.message}`);
      }

      toast.success('거래명세서가 등록되었습니다.');
      router.push(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(
        error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const validItemCount = items.filter(
    (item) => item.name && item.quantity && Number(item.quantity) > 0,
  ).length;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/invoices' aria-label='목록으로 돌아가기'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>거래명세서 스캔</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              이미지를 업로드하고 OCR로 품목을 자동 추출합니다.
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          {imageFile && (
            <Button
              variant='outline'
              onClick={() => setShowScanConfirm(true)}
              disabled={isScanning}
              className='cursor-pointer'
            >
              {isScanning ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Sparkles className='mr-2 h-4 w-4' />
              )}
              {isScanning ? '분석 중...' : '자동 입력'}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || validItemCount === 0}
            className='cursor-pointer'
          >
            {isSaving ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-2 h-4 w-4' />
            )}
            저장 ({validItemCount}건)
          </Button>
        </div>
      </div>

      {/* Content: two-column layout */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left: Image upload + metadata */}
        <div className='space-y-6 lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>이미지 업로드</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                imagePreview={imagePreview}
                isScanning={isScanning}
                onFileSelect={handleFileSelect}
                onClear={handleClearImage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>명세서 정보</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <SupplierSelector
                suppliers={suppliers}
                selectedSupplierId={supplierId}
                onSelect={setSupplierId}
                newSupplierName={newSupplierName}
                onNewSupplierNameChange={setNewSupplierName}
                detectedSupplierName={detectedSupplierName}
              />

              <div className='space-y-2'>
                <Label htmlFor='invoiceNo' className='text-sm'>
                  명세서 번호
                </Label>
                <Input
                  id='invoiceNo'
                  placeholder='자동 추출 또는 직접 입력'
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='invoiceDate' className='text-sm'>
                  거래일자
                </Label>
                <Input
                  id='invoiceDate'
                  type='date'
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='notes' className='text-sm'>
                  비고
                </Label>
                <Textarea
                  id='notes'
                  placeholder='메모'
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: OCR results table */}
        <div className='lg:col-span-2'>
          <OCRResultTable
            items={items}
            ingredients={ingredients}
            onUpdate={handleItemUpdate}
            onAdd={handleItemAdd}
            onRemove={handleItemRemove}
          />
        </div>
      </div>

      {/* Scan confirmation */}
      <AlertDialog open={showScanConfirm} onOpenChange={setShowScanConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>자동 입력 실행</AlertDialogTitle>
            <AlertDialogDescription>
              이미지를 스캔하고 품목을 자동으로 추출합니다.
              <br />
              API 사용량이 차감됩니다. 진행하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowScanConfirm(false);
                handleScanAndParse();
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
