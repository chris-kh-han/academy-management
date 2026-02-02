'use client';

import * as React from 'react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
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
import { bulkSaveClosingItemsAction } from '../actions';

type Ingredient = {
  id: string;
  ingredient_name: string;
  category: string;
  unit: string;
  current_qty: number;
};

type ParsedClosingItem = {
  ingredient_name: string;
  used_qty: number;
  waste_qty: number;
  note: string;
  // 매칭 결과
  ingredient_id?: string;
  opening_qty?: number;
  unit?: string;
  isMatched: boolean;
  error?: string;
};

type ClosingUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closingId: string;
  ingredients: Ingredient[];
  onUploadComplete: () => void;
};

// CSV 헤더 매핑
const HEADER_MAP: Record<string, keyof ParsedClosingItem> = {
  품목명: 'ingredient_name',
  사용량: 'used_qty',
  폐기량: 'waste_qty',
  비고: 'note',
};

export function ClosingUploadDialog({
  open,
  onOpenChange,
  closingId,
  ingredients,
  onUploadComplete,
}: ClosingUploadDialogProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<ParsedClosingItem[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 다이얼로그 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!open) {
      setParsedData([]);
      setFileName(null);
    }
  }, [open]);

  // 재료명으로 ingredient 매칭
  const matchIngredient = (
    name: string,
  ): { ingredient: Ingredient | undefined; matched: boolean } => {
    // 정확한 매칭
    let ingredient = ingredients.find((i) => i.ingredient_name === name);
    if (ingredient) return { ingredient, matched: true };

    // 대소문자 무시 매칭
    ingredient = ingredients.find(
      (i) => i.ingredient_name.toLowerCase() === name.toLowerCase(),
    );
    if (ingredient) return { ingredient, matched: true };

    // 부분 매칭 (입력값이 재료명을 포함하거나, 재료명이 입력값을 포함)
    ingredient = ingredients.find(
      (i) =>
        i.ingredient_name.includes(name) || name.includes(i.ingredient_name),
    );
    if (ingredient) return { ingredient, matched: true };

    return { ingredient: undefined, matched: false };
  };

  // 템플릿 데이터
  const templateHeaders = ['품목명', '사용량', '폐기량', '비고'];
  const templateRows = [
    ['SF)불고기탑핑', '5', '0', ''],
    ['밀가루', '2.5', '0.5', '유통기한 임박'],
    ['동원)갈릭딥핑', '10', '0', ''],
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
      `마감_템플릿_${new Date().toISOString().split('T')[0]}.csv`,
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
    const worksheet = workbook.addWorksheet('마감');

    // 컬럼 설정
    worksheet.columns = [
      { header: '품목명', key: 'name', width: 20 },
      { header: '사용량', key: 'used', width: 10 },
      { header: '폐기량', key: 'waste', width: 10 },
      { header: '비고', key: 'note', width: 20 },
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
    link.download = `마감_템플릿_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        const parsed: ParsedClosingItem[] = (
          results.data as Record<string, string>[]
        ).map((row) => {
          const item: ParsedClosingItem = {
            ingredient_name: '',
            used_qty: 0,
            waste_qty: 0,
            note: '',
            isMatched: false,
          };

          // 헤더 매핑
          Object.entries(HEADER_MAP).forEach(([csvHeader, field]) => {
            const value = row[csvHeader]?.trim() || '';
            if (field === 'used_qty' || field === 'waste_qty') {
              const num = parseFloat(value);
              (item[field] as number) = isNaN(num) ? 0 : num;
            } else {
              (item[field] as string) = value;
            }
          });

          // 재료 매칭
          if (item.ingredient_name) {
            const { ingredient, matched } = matchIngredient(
              item.ingredient_name,
            );
            if (matched && ingredient) {
              item.ingredient_id = ingredient.id;
              item.opening_qty = ingredient.current_qty;
              item.unit = ingredient.unit;
              item.isMatched = true;
            } else {
              item.error = '재료를 찾을 수 없음';
            }
          } else {
            item.error = '품목명 필수';
          }

          return item;
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

      const parsed: ParsedClosingItem[] = [];

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

        const item: ParsedClosingItem = {
          ingredient_name: '',
          used_qty: 0,
          waste_qty: 0,
          note: '',
          isMatched: false,
        };

        // 헤더 매핑
        Object.entries(HEADER_MAP).forEach(([csvHeader, field]) => {
          const value = rowData[csvHeader];
          const strValue = value !== undefined ? String(value).trim() : '';
          if (field === 'used_qty' || field === 'waste_qty') {
            const num = parseFloat(strValue);
            (item[field] as number) = isNaN(num) ? 0 : num;
          } else {
            (item[field] as string) = strValue;
          }
        });

        // 재료 매칭
        if (item.ingredient_name) {
          const { ingredient, matched } = matchIngredient(item.ingredient_name);
          if (matched && ingredient) {
            item.ingredient_id = ingredient.id;
            item.opening_qty = ingredient.current_qty;
            item.unit = ingredient.unit;
            item.isMatched = true;
          } else {
            item.error = '재료를 찾을 수 없음';
          }
        } else {
          item.error = '품목명 필수';
        }

        parsed.push(item);
      });

      setParsedData(parsed);
    } catch (error) {
      toast.error(
        `파일 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
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
    const validData = parsedData.filter((d) => d.isMatched);
    if (validData.length === 0) {
      toast.error('업로드할 유효한 데이터가 없습니다.');
      return;
    }

    setIsLoading(true);

    const items = validData.map((d) => ({
      ingredient_id: d.ingredient_id!,
      opening_qty: d.opening_qty!,
      used_qty: d.used_qty,
      waste_qty: d.waste_qty || 0,
      note: d.note || undefined,
    }));

    const result = await bulkSaveClosingItemsAction(closingId, items);

    setIsLoading(false);

    if (result.success) {
      toast.success(`${result.count}개 항목이 저장되었습니다.`);
      onUploadComplete();
      onOpenChange(false);
    } else {
      toast.error(result.error || '업로드에 실패했습니다.');
    }
  };

  const matchedCount = parsedData.filter((d) => d.isMatched).length;
  const unmatchedCount = parsedData.filter((d) => !d.isMatched).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Excel 업로드</DialogTitle>
          <DialogDescription>
            CSV 또는 Excel 파일로 마감 데이터를 일괄 입력합니다. 동일 재료는
            덮어쓰기됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* 템플릿 다운로드 */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <p className="font-medium">템플릿 다운로드</p>
              <p className="text-muted-foreground">
                양식에 맞게 사용량/폐기량을 입력하세요
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={downloadCSVTemplate}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={downloadXLSXTemplate}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
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
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                CSV, Excel 파일을 여기에 드래그하거나
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    파싱 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* 파일 정보 */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{fileName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    총 {parsedData.length}행 (매칭: {matchedCount}
                    {unmatchedCount > 0 && (
                      <span className="text-red-500">
                        , 실패: {unmatchedCount}
                      </span>
                    )}
                    )
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setParsedData([]);
                      setFileName(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 미리보기 테이블 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>품목명</TableHead>
                        <TableHead className="text-right">현재고</TableHead>
                        <TableHead className="text-right">사용량</TableHead>
                        <TableHead className="text-right">폐기량</TableHead>
                        <TableHead>비고</TableHead>
                        <TableHead className="w-[80px]">상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className={!row.isMatched ? 'bg-red-50' : ''}
                        >
                          <TableCell className="text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.ingredient_name || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.isMatched
                              ? `${row.opening_qty} ${row.unit}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.used_qty}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.waste_qty}
                          </TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-[100px]">
                            {row.note || '-'}
                          </TableCell>
                          <TableCell>
                            {row.isMatched ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3" />
                                매칭
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                                title={row.error}
                              >
                                <AlertCircle className="h-3 w-3" />
                                실패
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isLoading || matchedCount === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {matchedCount}개 적용
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
