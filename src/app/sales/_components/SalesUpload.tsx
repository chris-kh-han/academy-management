'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Settings2 } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { useBranch } from '@/contexts/BranchContext';
import type { SalesUploadRow } from '@/types';
import { ColumnMappingDialog, type ColumnMapping } from './ColumnMappingDialog';
import { getCSVMapping, saveCSVMapping, getExistingMenuNames } from '../_actions/uploadSales';

type SalesUploadProps = {
  onParsed: (data: SalesUploadRow[]) => void;
};

export function SalesUpload({ onParsed }: SalesUploadProps) {
  const { currentBranch } = useBranch();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // CSV 원본 데이터
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);

  // 매핑 관련
  const [savedMapping, setSavedMapping] = useState<ColumnMapping | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [existingMenus, setExistingMenus] = useState<string[]>([]);

  // 저장된 매핑 로드
  useEffect(() => {
    async function loadMapping() {
      if (!currentBranch?.id) return;

      const [mapping, menus] = await Promise.all([
        getCSVMapping(currentBranch.id),
        getExistingMenuNames(currentBranch.id),
      ]);

      if (mapping) {
        setSavedMapping({
          date_column: mapping.date_column || '',
          menu_name_column: mapping.menu_name_column || '',
          quantity_column: mapping.quantity_column || '',
          price_column: mapping.price_column || '',
          total_column: mapping.total_column || '',
          transaction_id_column: mapping.transaction_id_column || '',
        });
      }
      setExistingMenus(menus);
    }
    loadMapping();
  }, [currentBranch?.id]);

  // CSV 파싱 후 데이터 변환
  const applyMapping = useCallback((
    headers: string[],
    data: string[][],
    mapping: ColumnMapping
  ) => {
    const getColumnIndex = (columnName?: string) => {
      if (!columnName) return -1;
      return headers.indexOf(columnName);
    };

    const dateIdx = getColumnIndex(mapping.date_column);
    const menuNameIdx = getColumnIndex(mapping.menu_name_column);
    const quantityIdx = getColumnIndex(mapping.quantity_column);
    const priceIdx = getColumnIndex(mapping.price_column);
    const totalIdx = getColumnIndex(mapping.total_column);
    const transactionIdIdx = getColumnIndex(mapping.transaction_id_column);

    const parsedData: SalesUploadRow[] = data.map((row) => {
      const menuName = menuNameIdx >= 0 ? row[menuNameIdx]?.trim() : '';
      const soldAt = dateIdx >= 0 ? row[dateIdx]?.trim() : '';
      const salesCount = quantityIdx >= 0 ? parseInt(row[quantityIdx], 10) : 0;
      const price = priceIdx >= 0 ? parseInt(row[priceIdx], 10) : undefined;
      const total = totalIdx >= 0 ? parseInt(row[totalIdx], 10) : undefined;
      const transactionId = transactionIdIdx >= 0 ? row[transactionIdIdx]?.trim() : undefined;

      // 검증
      let isValid = true;
      let error = '';

      if (!soldAt) {
        isValid = false;
        error = '판매일자 누락';
      } else if (!menuName) {
        isValid = false;
        error = '메뉴명 누락';
      } else if (isNaN(salesCount) || salesCount <= 0) {
        isValid = false;
        error = '판매수량 오류';
      }

      // 새 메뉴 여부 확인
      const isNewMenu = menuName ? !existingMenus.includes(menuName) : false;

      return {
        sold_at: soldAt,
        menu_name: menuName,
        sales_count: salesCount,
        price: isNaN(price || 0) ? undefined : price,
        total_sales: isNaN(total || 0) ? undefined : total,
        transaction_id: transactionId || undefined,
        isValid,
        isNewMenu,
        error,
      };
    });

    return parsedData;
  }, [existingMenus]);

  // 매핑 적용 및 데이터 전달
  const handleMappingConfirm = useCallback(async (mapping: ColumnMapping) => {
    setShowMappingDialog(false);

    // 매핑 저장
    if (currentBranch?.id) {
      await saveCSVMapping(currentBranch.id, mapping);
      setSavedMapping(mapping);
    }

    // 데이터 변환
    const parsedData = applyMapping(rawHeaders, rawData, mapping);

    const validCount = parsedData.filter((d) => d.isValid).length;
    const newMenuCount = parsedData.filter((d) => d.isNewMenu).length;
    const errorCount = parsedData.length - validCount;

    if (errorCount > 0) {
      toast.warning(`${parsedData.length}건 중 ${errorCount}건에 오류가 있습니다.`);
    } else if (newMenuCount > 0) {
      toast.info(`${validCount}건 읽음 (새 메뉴 ${newMenuCount}개 감지)`);
    } else {
      toast.success(`${validCount}건의 데이터를 성공적으로 읽었습니다.`);
    }

    onParsed(parsedData);
  }, [rawHeaders, rawData, currentBranch?.id, applyMapping, onParsed]);

  // CSV 파일 파싱
  const parseCSV = useCallback(
    (file: File) => {
      setIsProcessing(true);

      Papa.parse<string[]>(file, {
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rows = results.data;
            if (rows.length < 2) {
              toast.error('CSV 파일에 데이터가 없습니다.');
              setIsProcessing(false);
              return;
            }

            const headers = rows[0].map(h => h.trim());
            const dataRows = rows.slice(1);

            setRawHeaders(headers);
            setRawData(dataRows);

            // 저장된 매핑이 있고, 현재 헤더와 호환되는지 확인
            if (savedMapping &&
                headers.includes(savedMapping.date_column) &&
                headers.includes(savedMapping.menu_name_column) &&
                headers.includes(savedMapping.quantity_column)) {
              // 저장된 매핑 자동 적용
              const parsedData = applyMapping(headers, dataRows, savedMapping);

              const validCount = parsedData.filter((d) => d.isValid).length;
              const newMenuCount = parsedData.filter((d) => d.isNewMenu).length;
              const errorCount = parsedData.length - validCount;

              if (errorCount > 0) {
                toast.warning(`${parsedData.length}건 중 ${errorCount}건에 오류가 있습니다.`);
              } else if (newMenuCount > 0) {
                toast.info(`${validCount}건 읽음 (새 메뉴 ${newMenuCount}개 감지)`);
              } else {
                toast.success(`${validCount}건의 데이터를 성공적으로 읽었습니다.`);
              }

              onParsed(parsedData);
            } else {
              // 매핑 다이얼로그 표시
              setShowMappingDialog(true);
            }
          } catch (error) {
            console.error('CSV parsing error:', error);
            toast.error('CSV 파일 처리 중 오류가 발생했습니다.');
          } finally {
            setIsProcessing(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast.error('CSV 파일을 읽을 수 없습니다.');
          setIsProcessing(false);
        },
      });
    },
    [savedMapping, applyMapping, onParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        if (!file.name.endsWith('.csv')) {
          toast.error('CSV 파일만 업로드할 수 있습니다.');
          return;
        }
        parseCSV(file);
      }
    },
    [parseCSV],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        parseCSV(file);
      }
      e.target.value = '';
    },
    [parseCSV],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // 매핑 설정 버튼 클릭
  const handleOpenMappingSettings = () => {
    if (rawHeaders.length > 0) {
      setShowMappingDialog(true);
    } else {
      toast.info('먼저 CSV 파일을 업로드하세요.');
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* 매핑 설정 버튼 */}
        {savedMapping && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenMappingSettings}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              컬럼 매핑 설정
            </Button>
          </div>
        )}

        {/* 업로드 영역 */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-300 dark:border-gray-700'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary dark:hover:border-primary'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('csv-file-input')?.click()}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">파일 처리 중...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4">
                  {isDragging ? (
                    <Upload className="h-8 w-8 text-primary" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    CSV 파일을 드래그하거나 클릭하여 업로드하세요
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    어떤 CSV 형식이든 지원됩니다 (첫 업로드 시 컬럼 매핑 설정)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 컬럼 매핑 다이얼로그 */}
      <ColumnMappingDialog
        open={showMappingDialog}
        onOpenChange={setShowMappingDialog}
        csvHeaders={rawHeaders}
        sampleRow={rawData[0] || []}
        savedMapping={savedMapping}
        onConfirm={handleMappingConfirm}
      />
    </>
  );
}
