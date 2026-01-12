'use client';

import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { SalesUpload } from './SalesUpload';
import { CSVPreview } from './CSVPreview';
import { SalesTable } from './SalesTable';
import { DuplicateConfirmDialog } from './DuplicateConfirmDialog';
import { uploadSales, deleteSale, checkDuplicates, refreshSalesData, fetchSalesByDateRange } from '../_actions/uploadSales';
import { useBranch } from '@/contexts/BranchContext';
import type { SalesUploadRow, MenuSale } from '@/types';

type SalesContentProps = {
  initialSalesData: MenuSale[];
};

export function SalesContent({ initialSalesData }: SalesContentProps) {
  const { currentBranch } = useBranch();
  const [parsedData, setParsedData] = useState<SalesUploadRow[]>([]);
  const [salesData, setSalesData] = useState<MenuSale[]>(initialSalesData);

  // 날짜 필터 상태
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // 데이터에서 존재하는 월 목록 추출
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    initialSalesData.forEach((sale) => {
      const month = sale.sold_at?.slice(0, 7);
      if (month) months.add(month);
    });
    return Array.from(months).sort().reverse();
  }, [initialSalesData]);

  // 중복 확인 다이얼로그 상태
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    total: number;
    duplicates: number;
    newRecords: number;
  } | null>(null);
  const [pendingUploadData, setPendingUploadData] = useState<SalesUploadRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 삭제 확인 다이얼로그 상태
  const [deleteSaleId, setDeleteSaleId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleParsed = (data: SalesUploadRow[]) => {
    setParsedData(data);
  };

  const handleClear = () => {
    setParsedData([]);
  };

  // 실제 업로드 수행
  const performUpload = async (validData: SalesUploadRow[]) => {
    if (!currentBranch?.id) {
      toast.error('지점 정보를 불러올 수 없습니다.');
      return { success: false, inserted: 0, updated: 0, menusCreated: 0, errors: [] };
    }

    setIsUploading(true);
    try {
      const result = await uploadSales(validData, currentBranch.id);

      if (result.success) {
        // 결과 메시지 구성
        const parts: string[] = [];
        if (result.inserted > 0) {
          parts.push(`${result.inserted}건 신규 저장`);
        }
        if (result.updated > 0) {
          parts.push(`${result.updated}건 덮어쓰기`);
        }
        if (result.menusCreated > 0) {
          parts.push(`신규 메뉴 ${result.menusCreated}개 생성`);
        }

        const message = parts.join(', ');

        // 덮어쓰기가 있으면 info, 없으면 success
        if (result.updated > 0) {
          toast.info(message || '업로드 완료');
        } else {
          toast.success(message || '업로드 완료');
        }

        setParsedData([]);
        setShowDuplicateDialog(false);
        setPendingUploadData([]);

        // 테이블 데이터 새로고침
        const freshData = await refreshSalesData(currentBranch.id);
        setSalesData(freshData);
      } else {
        toast.error(
          `${result.inserted}건 업로드 완료, ${result.errors.length}건 실패`,
        );
        result.errors.forEach((err) => {
          console.error('Upload error:', err);
        });
      }

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
      return { success: false, inserted: 0, updated: 0, menusCreated: 0, errors: [] };
    } finally {
      setIsUploading(false);
    }
  };

  // 업로드 확인 버튼 클릭 시 - 먼저 중복 체크
  const handleConfirm = async (validData: SalesUploadRow[]) => {
    if (!currentBranch?.id) {
      toast.error('지점 정보를 불러올 수 없습니다.');
      return { success: false, inserted: 0, updated: 0, menusCreated: 0, errors: [] };
    }

    try {
      // 1. 중복 체크
      const duplicateResult = await checkDuplicates(validData, currentBranch.id);

      // 2. 중복이 있으면 확인 다이얼로그 표시
      if (duplicateResult.duplicates > 0) {
        setDuplicateInfo(duplicateResult);
        setPendingUploadData(validData);
        setShowDuplicateDialog(true);
        return { success: true, inserted: 0, updated: 0, menusCreated: 0, errors: [] };
      }

      // 3. 중복 없으면 바로 업로드
      return await performUpload(validData);
    } catch (error) {
      console.error('Check duplicates error:', error);
      toast.error('중복 확인 중 오류가 발생했습니다.');
      return { success: false, inserted: 0, updated: 0, menusCreated: 0, errors: [] };
    }
  };

  // 중복 확인 다이얼로그에서 "덮어쓰기" 클릭
  const handleDuplicateConfirm = async () => {
    await performUpload(pendingUploadData);
  };

  // 월별 필터 선택
  const handleMonthSelect = async (month: string | null) => {
    if (!currentBranch?.id) return;

    setIsFiltering(true);
    setSelectedMonth(month);
    setStartDate('');
    setEndDate('');

    try {
      if (month === null) {
        // 전체 조회
        const data = await fetchSalesByDateRange(currentBranch.id);
        setSalesData(data);
      } else {
        // 해당 월의 첫째날과 마지막날 계산
        const [year, mon] = month.split('-').map(Number);
        const lastDay = new Date(year, mon, 0).getDate();
        const start = `${month}-01`;
        const end = `${month}-${String(lastDay).padStart(2, '0')}`;
        const data = await fetchSalesByDateRange(currentBranch.id, start, end);
        setSalesData(data);
      }
    } catch (error) {
      console.error('Month filter error:', error);
      toast.error('데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setIsFiltering(false);
    }
  };

  // 기간 직접 선택 조회
  const handleDateRangeFilter = async () => {
    if (!currentBranch?.id) return;
    if (!startDate || !endDate) {
      toast.error('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    setIsFiltering(true);
    setSelectedMonth(null);

    try {
      const data = await fetchSalesByDateRange(currentBranch.id, startDate, endDate);
      setSalesData(data);
    } catch (error) {
      console.error('Date range filter error:', error);
      toast.error('데이터 조회 중 오류가 발생했습니다.');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteSaleId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSaleId) return;

    setIsDeleting(true);
    try {
      const result = await deleteSale(deleteSaleId);
      if (result.success) {
        toast.success('판매 내역이 삭제되었습니다.');
        setSalesData((prev) => prev.filter((sale) => sale.id !== deleteSaleId));
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteSaleId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 중복 확인 다이얼로그 */}
      <DuplicateConfirmDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        total={duplicateInfo?.total ?? 0}
        duplicates={duplicateInfo?.duplicates ?? 0}
        newRecords={duplicateInfo?.newRecords ?? 0}
        onConfirm={handleDuplicateConfirm}
        isLoading={isUploading}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteSaleId} onOpenChange={(open) => !open && setDeleteSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>판매 내역 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 판매 내역을 삭제하시겠습니까? 삭제된 내역은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 헤더 섹션 */}
      <Card className="bg-white dark:bg-gray-950">
        <CardHeader>
          <div>
            <CardTitle>판매 관리</CardTitle>
            <CardDescription className="mt-1">
              CSV 파일로 판매 데이터를 업로드하세요. 어떤 형식이든 지원됩니다.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SalesUpload onParsed={handleParsed} />
        </CardContent>
      </Card>

      {/* CSV 미리보기 */}
      {parsedData.length > 0 && (
        <CSVPreview
          data={parsedData}
          onConfirm={handleConfirm}
          onClear={handleClear}
        />
      )}

      <Separator className="my-6" />

      {/* 판매 내역 테이블 */}
      <Card className="bg-white dark:bg-gray-950">
        <CardHeader>
          <CardTitle>판매 내역</CardTitle>
          <CardDescription>등록된 판매 데이터를 조회합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 월별 퀵 선택 */}
          {availableMonths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMonth === null && !startDate ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMonthSelect(null)}
                disabled={isFiltering}
              >
                전체
              </Button>
              {availableMonths.map((month) => (
                <Button
                  key={month}
                  variant={selectedMonth === month ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMonthSelect(month)}
                  disabled={isFiltering}
                >
                  {month.replace('-', '.')}
                </Button>
              ))}
            </div>
          )}

          {/* 기간 직접 선택 */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">~</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDateRangeFilter}
              disabled={isFiltering || !startDate || !endDate}
            >
              {isFiltering ? '조회 중...' : '조회'}
            </Button>
          </div>

          <SalesTable data={salesData} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  );
}
