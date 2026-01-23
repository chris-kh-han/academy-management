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
import { uploadMenusAction } from '../_actions/uploadMenu';
import { createCategory } from '../_actions/categoryActions';
import { useBranch } from '@/contexts/BranchContext';

type ParsedMenu = {
  menu_name: string;
  price: number;
  category_name: string;
  isValid: boolean;
  error?: string;
};

type Category = {
  id: string;
  name: string;
};

type MenuUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
};

// CSV 헤더 매핑
const HEADER_MAP: Record<string, keyof ParsedMenu> = {
  메뉴명: 'menu_name',
  가격: 'price',
  카테고리: 'category_name',
};

export function MenuUploadDialog({
  open,
  onOpenChange,
  categories,
}: MenuUploadDialogProps) {
  const { currentBranch } = useBranch();
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedMenu[]>([]);
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
  const templateHeaders = ['메뉴명', '가격', '카테고리'];

  const templateRows = [
    ['페퍼로니 피자', '15000', '피자'],
    ['마르게리타', '13000', '피자'],
    ['콜라', '2000', '음료'],
    ['아메리카노', '3500', ''],
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
      `메뉴_템플릿_${new Date().toISOString().split('T')[0]}.csv`,
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
    const worksheet = workbook.addWorksheet('메뉴');

    // 컬럼 설정
    worksheet.columns = [
      { header: '메뉴명', key: 'name', width: 20 },
      { header: '가격', key: 'price', width: 12 },
      { header: '카테고리', key: 'category', width: 15 },
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
    link.download = `메뉴_템플릿_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
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
        const parsed: ParsedMenu[] = (
          results.data as Record<string, string>[]
        ).map((row) => {
          const menu: ParsedMenu = {
            menu_name: '',
            price: 0,
            category_name: '',
            isValid: true,
          };

          // 헤더 매핑
          Object.entries(HEADER_MAP).forEach(([csvHeader, field]) => {
            const value = row[csvHeader]?.trim() || '';
            if (field === 'price') {
              const num = parseFloat(value);
              menu.price = isNaN(num) ? 0 : num;
            } else {
              (menu[field] as string) = value;
            }
          });

          // 유효성 검사 (메뉴명, 가격 필수)
          if (!menu.menu_name) {
            menu.isValid = false;
            menu.error = '메뉴명 필수';
          } else if (menu.price <= 0) {
            menu.isValid = false;
            menu.error = '가격 필수';
          }

          return menu;
        });

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

      const parsed: ParsedMenu[] = [];

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

        const menu: ParsedMenu = {
          menu_name: '',
          price: 0,
          category_name: '',
          isValid: true,
        };

        // 헤더 매핑
        Object.entries(HEADER_MAP).forEach(([csvHeader, field]) => {
          const value = rowData[csvHeader];
          const strValue = value !== undefined ? String(value).trim() : '';
          if (field === 'price') {
            const num = parseFloat(strValue);
            menu.price = isNaN(num) ? 0 : num;
          } else {
            (menu[field] as string) = strValue;
          }
        });

        // 유효성 검사 (메뉴명, 가격 필수)
        if (!menu.menu_name) {
          menu.isValid = false;
          menu.error = '메뉴명 필수';
        } else if (menu.price <= 0) {
          menu.isValid = false;
          menu.error = '가격 필수';
        }

        parsed.push(menu);
      });

      setParsedData(parsed);
    } catch (error) {
      toast.error(
        `파일 파싱 오류: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`,
      );
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

    // 1. 기존 카테고리명 → category_id 매핑
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    // 2. 새로운 카테고리명 찾기
    const existingCategoryNames = new Set(categories.map((c) => c.name));
    const newCategoryNames = [
      ...new Set(
        validData
          .map((d) => d.category_name)
          .filter(
            (name): name is string =>
              !!name && !existingCategoryNames.has(name),
          ),
      ),
    ];

    // 3. 새 카테고리 자동 생성
    for (const categoryName of newCategoryNames) {
      // slug 생성: 한글/영문/숫자만 남기고 공백은 하이픈으로
      const slug = categoryName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9가-힣-]/g, '');
      const result = await createCategory({
        name: categoryName,
        slug: slug || `category-${Date.now()}`,
        icon: '',
        branch_id: currentBranch.id,
        category_type: 'menu',
      });
      if (result.success && result.data) {
        categoryMap.set(categoryName, result.data.id);
      }
    }

    // 4. 메뉴 데이터 준비
    const menus = validData.map((d) => ({
      menu_name: d.menu_name,
      price: d.price,
      category_id: d.category_name
        ? categoryMap.get(d.category_name)
        : undefined,
      category: d.category_name || undefined,
      branch_id: currentBranch.id,
    }));

    const result = await uploadMenusAction(menus);

    setIsLoading(false);

    if (result.success) {
      toast.success(
        `${result.inserted}개 추가 완료${
          result.skipped > 0 ? `, ${result.skipped}개 중복 건너뜀` : ''
        }`,
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
      <DialogContent className='sm:max-w-[600px] max-h-[85vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>메뉴 일괄 업로드</DialogTitle>
          <DialogDescription>
            CSV 또는 Excel 파일로 여러 메뉴를 한 번에 추가합니다. 중복된
            메뉴명은 자동으로 건너뜁니다.
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
                      <span className='text-red-500'>
                        , 오류: {invalidCount}
                      </span>
                    )}
                    )
                  </span>
                  <Button
                    variant='ghost'
                    size='sm'
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
                        <TableHead>메뉴명</TableHead>
                        <TableHead className='text-right'>가격</TableHead>
                        <TableHead>카테고리</TableHead>
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
                            {row.menu_name || '-'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {row.price?.toLocaleString() || '0'}원
                          </TableCell>
                          <TableCell>{row.category_name || '-'}</TableCell>
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
