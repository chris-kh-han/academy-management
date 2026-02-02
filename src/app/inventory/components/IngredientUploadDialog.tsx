'use client';

import * as React from 'react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { Download, Upload, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'react-toastify';
import { uploadIngredientsAction } from '../actions';
import { useBranch } from '@/contexts/BranchContext';

type ParsedIngredient = {
  ingredient_name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  current_qty: number;
  reorder_point: number | null;
  safety_stock: number | null;
  isValid: boolean;
  error?: string;
};

type IngredientUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// CSV 헤더 매핑
const HEADER_MAP: Record<string, keyof ParsedIngredient> = {
  품목명: 'ingredient_name',
  카테고리: 'category',
  규격: 'specification',
  단위: 'unit',
  단가: 'price',
  수량: 'current_qty',
  재주문점: 'reorder_point',
  안전재고: 'safety_stock',
};

export function IngredientUploadDialog({
  open,
  onOpenChange,
}: IngredientUploadDialogProps) {
  const { currentBranch } = useBranch();
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedIngredient[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 다이얼로그 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!open) {
      setParsedData([]);
      setFileName(null);
    }
  }, [open]);

  // 템플릿 데이터
  const templateHeaders = [
    '품목명',
    '카테고리',
    '규격',
    '단위',
    '단가',
    '수량',
    '재주문점',
    '안전재고',
  ];

  const templateRows = [
    ['SF)불고기탑핑', '육류', '1kg*10pk', '봉지', '12000', '50', '10', '20'],
    ['동원)갈릭딥핑', '소스/양념', '15g*500ea', 'ea', '8000', '100', '20', '50'],
    ['밀가루', '곡물/분류', '1kg', 'kg', '3000', '30', '5', '10'],
  ];

  // CSV 템플릿 다운로드
  const downloadCSVTemplate = () => {
    const csvContent = [
      templateHeaders.join(','),
      ...templateRows.map((row) => row.join(',')),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `재료_템플릿_${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // XLSX 템플릿 다운로드
  const downloadXLSXTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('품목');

    // 컬럼 설정
    worksheet.columns = [
      { header: '품목명', key: 'name', width: 18 },
      { header: '카테고리', key: 'category', width: 12 },
      { header: '규격', key: 'spec', width: 14 },
      { header: '단위', key: 'unit', width: 8 },
      { header: '단가', key: 'price', width: 10 },
      { header: '수량', key: 'qty', width: 10 },
      { header: '재주문점', key: 'reorder', width: 10 },
      { header: '안전재고', key: 'safety', width: 10 },
    ];

    // 샘플 데이터 추가
    templateRows.forEach((row) => {
      worksheet.addRow(row);
    });

    // 헤더 스타일
    worksheet.getRow(1).font = { bold: true };

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `품목_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV 파싱
  const parseCSV = (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedIngredient[] = (results.data as Record<string, string>[]).map(
          (row) => {
            const ingredient: ParsedIngredient = {
              ingredient_name: '',
              category: '',
              specification: '',
              unit: '',
              price: 0,
              current_qty: 0,
              reorder_point: null,
              safety_stock: null,
              isValid: true,
            };

            // 헤더 매핑
            Object.entries(HEADER_MAP).forEach(([csvHeader, field]) => {
              const value = row[csvHeader]?.trim() || '';
              if (
                field === 'price' ||
                field === 'current_qty' ||
                field === 'reorder_point' ||
                field === 'safety_stock'
              ) {
                const num = parseFloat(value);
                if (field === 'reorder_point' || field === 'safety_stock') {
                  (ingredient[field] as number | null) = value ? num : null;
                } else {
                  (ingredient[field] as number) = isNaN(num) ? 0 : num;
                }
              } else {
                (ingredient[field] as string) = value;
              }
            });

            // 유효성 검사 (품목명만 필수)
            if (!ingredient.ingredient_name) {
              ingredient.isValid = false;
              ingredient.error = '품목명 필수';
            }

            return ingredient;
          },
        );

        setParsedData(parsed);
        setIsLoading(false);
      },
      error: (error) => {
        toast.error(`파일 파싱 오류: ${error.message}`);
        setIsLoading(false);
      },
    });
  };

  // XLSX/XLS 파싱
  const parseXLSX = async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('시트를 찾을 수 없습니다.');
      }

      // 첫 번째 행을 헤더로 사용
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || '').trim();
      });

      const parsed: ParsedIngredient[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // 헤더 행 건너뛰기

        const rowData: Record<string, string | number> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value as string | number;
          }
        });

        // 빈 행 건너뛰기
        if (Object.keys(rowData).length === 0) return;

        const ingredient: ParsedIngredient = {
          ingredient_name: '',
          category: '',
          specification: '',
          unit: '',
          price: 0,
          current_qty: 0,
          reorder_point: null,
          safety_stock: null,
          isValid: true,
        };

        // 헤더 매핑
        Object.entries(HEADER_MAP).forEach(([csvHeader, field]) => {
          const value = rowData[csvHeader];
          const strValue = value !== undefined ? String(value).trim() : '';
          if (
            field === 'price' ||
            field === 'current_qty' ||
            field === 'reorder_point' ||
            field === 'safety_stock'
          ) {
            const num = parseFloat(strValue);
            if (field === 'reorder_point' || field === 'safety_stock') {
              (ingredient[field] as number | null) = strValue ? num : null;
            } else {
              (ingredient[field] as number) = isNaN(num) ? 0 : num;
            }
          } else {
            (ingredient[field] as string) = strValue;
          }
        });

        // 유효성 검사 (품목명만 필수)
        if (!ingredient.ingredient_name) {
          ingredient.isValid = false;
          ingredient.error = '품목명 필수';
        }

        parsed.push(ingredient);
      });

      setParsedData(parsed);
    } catch (error) {
      toast.error(`파일 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 타입 확인 및 파싱
  const parseFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      parseCSV(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      parseXLSX(file);
    } else {
      toast.error('CSV, XLSX, XLS 파일만 업로드 가능합니다.');
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseFile(file);
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
      parseFile(file);
    }
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!currentBranch?.id) {
      toast.error('지점 정보가 없습니다.');
      return;
    }

    const validData = parsedData.filter((d) => d.isValid);
    if (validData.length === 0) {
      toast.error('업로드할 유효한 데이터가 없습니다.');
      return;
    }

    setIsLoading(true);

    const ingredients = validData.map((d) => ({
      ingredient_name: d.ingredient_name,
      category: d.category || undefined,
      specification: d.specification || undefined,
      unit: d.unit,
      price: d.price || undefined,
      current_qty: d.current_qty || undefined,
      reorder_point: d.reorder_point ?? undefined,
      safety_stock: d.safety_stock ?? undefined,
      branch_id: currentBranch.id,
    }));

    const result = await uploadIngredientsAction(ingredients);

    setIsLoading(false);

    if (result.success) {
      toast.success(
        `${result.inserted}개 추가 완료${result.skipped > 0 ? `, ${result.skipped}개 중복 건너뜀` : ''}`,
      );
      onOpenChange(false);
    } else {
      toast.error(result.error || '업로드에 실패했습니다.');
    }
  };

  const validCount = parsedData.filter((d) => d.isValid).length;
  const invalidCount = parsedData.filter((d) => !d.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[700px] max-h-[85vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>재료 일괄 업로드</DialogTitle>
          <DialogDescription>
            CSV 또는 Excel 파일로 여러 재료를 한 번에 추가합니다. 중복된 품목명은 자동으로
            건너뜁니다.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto space-y-4 py-4'>
          {/* 템플릿 다운로드 */}
          <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
            <div className='text-sm'>
              <p className='font-medium'>템플릿 다운로드</p>
              <p className='text-muted-foreground'>
                양식에 맞게 데이터를 입력하세요
              </p>
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={downloadCSVTemplate}
                variant='outline'
                size='sm'
                className='gap-1.5'
              >
                <Download className='h-4 w-4' />
                CSV
              </Button>
              <Button
                onClick={downloadXLSXTemplate}
                variant='outline'
                size='sm'
                className='gap-1.5'
              >
                <Download className='h-4 w-4' />
                Excel
              </Button>
            </div>
          </div>

          {/* 파일 업로드 영역 */}
          {parsedData.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                accept='.csv,.xlsx,.xls'
                onChange={handleFileSelect}
                className='hidden'
              />
              <FileSpreadsheet className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-sm text-muted-foreground mb-2'>
                CSV, Excel 파일을 여기에 드래그하거나
              </p>
              <Button
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    파싱 중...
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
            <>
              {/* 파일 정보 */}
              <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <FileSpreadsheet className='h-5 w-5 text-muted-foreground' />
                  <span className='text-sm font-medium'>{fileName}</span>
                </div>
                <div className='flex items-center gap-4'>
                  <span className='text-sm text-muted-foreground'>
                    총 {parsedData.length}행 (유효: {validCount}
                    {invalidCount > 0 && (
                      <span className='text-red-500'>, 오류: {invalidCount}</span>
                    )}
                    )
                  </span>
                  <Button
                    variant='ghost'
                    size='sm'
                    aria-label='파일 제거'
                    onClick={() => {
                      setParsedData([]);
                      setFileName(null);
                    }}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* 미리보기 테이블 */}
              <div className='border rounded-lg overflow-hidden'>
                <div className='max-h-[300px] overflow-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[50px]'>#</TableHead>
                        <TableHead>품목명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead>규격</TableHead>
                        <TableHead>단위</TableHead>
                        <TableHead className='text-right'>단가</TableHead>
                        <TableHead className='text-right'>수량</TableHead>
                        <TableHead className='w-[80px]'>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className={!row.isValid ? 'bg-red-50' : ''}
                        >
                          <TableCell className='text-muted-foreground'>
                            {idx + 1}
                          </TableCell>
                          <TableCell className='font-medium'>
                            {row.ingredient_name || '-'}
                          </TableCell>
                          <TableCell>{row.category || '-'}</TableCell>
                          <TableCell>{row.specification || '-'}</TableCell>
                          <TableCell>{row.unit || '-'}</TableCell>
                          <TableCell className='text-right'>
                            {row.price?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {row.current_qty || '0'}
                          </TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <span className='text-xs px-2 py-1 rounded bg-green-100 text-green-700'>
                                OK
                              </span>
                            ) : (
                              <span
                                className='text-xs px-2 py-1 rounded bg-red-100 text-red-700'
                                title={row.error}
                              >
                                오류
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isLoading || validCount === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className='h-4 w-4 mr-2' />
                {validCount}개 업로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
