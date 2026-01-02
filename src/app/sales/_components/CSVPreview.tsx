'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SalesUploadRow } from '@/types';

type UploadResult = {
  success: boolean;
  inserted: number;
  updated: number;
  menusCreated: number;
  errors: string[];
};

type CSVPreviewProps = {
  data: SalesUploadRow[];
  onConfirm: (validData: SalesUploadRow[]) => Promise<UploadResult>;
  onClear: () => void;
};

// 날짜 포맷 (YYYY-MM-DD → MM/DD)
const formatDate = (dateString: string) => {
  try {
    const parts = dateString.split('-');
    if (parts.length >= 3) {
      return `${parts[1]}/${parts[2]}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
};

// 숫자 포맷 (원화)
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
};

const PAGE_SIZE = 20;

export function CSVPreview({ data, onConfirm, onClear }: CSVPreviewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const validData = data.filter((row) => row.isValid);
  const invalidData = data.filter((row) => !row.isValid);
  const newMenuData = data.filter((row) => row.isNewMenu && row.isValid);

  // 페이지네이션
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginatedData = data.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handleConfirm = async () => {
    if (validData.length === 0) {
      return;
    }

    setIsUploading(true);
    try {
      await onConfirm(validData);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-950">
      <CardHeader>
        <CardTitle className="text-lg">미리보기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-900">
                <TableHead className="w-[80px]">날짜</TableHead>
                <TableHead>메뉴명</TableHead>
                <TableHead className="text-right w-[80px]">수량</TableHead>
                <TableHead className="text-right w-[100px]">단가</TableHead>
                <TableHead className="text-right w-[120px]">총액</TableHead>
                <TableHead className="w-[60px]">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    업로드한 CSV 파일이 여기에 표시됩니다.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={
                      !row.isValid
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                        : row.isNewMenu
                          ? 'bg-blue-50 dark:bg-blue-950/20'
                          : ''
                    }
                  >
                    <TableCell className="text-sm">
                      {formatDate(row.sold_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {row.menu_name}
                        {row.isNewMenu && row.isValid && (
                          <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                            <Plus className="h-3 w-3" />
                            신규
                          </Badge>
                        )}
                      </div>
                      {row.error && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {row.error}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.sales_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.total_sales)}
                    </TableCell>
                    <TableCell>
                      {row.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        {data.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 py-3 border-t border-gray-200 dark:border-gray-800 mt-2">
            <div className="text-muted-foreground text-sm">
              {data.length}건 중 {currentPage * PAGE_SIZE + 1}-
              {Math.min((currentPage + 1) * PAGE_SIZE, data.length)}건 표시
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
              >
                {'<<'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                다음
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
              >
                {'>>'}
              </Button>
            </div>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {validData.length}건 검증 완료
                </span>
              </div>
              {newMenuData.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {newMenuData.length}개 신규 메뉴
                  </span>
                </div>
              )}
              {invalidData.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {invalidData.length}건 오류
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onClear} variant="outline" disabled={isUploading}>
                취소
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={validData.length === 0 || isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    업로드 확인
                    {newMenuData.length > 0 && (
                      <span className="text-xs opacity-75">
                        (+{newMenuData.length} 메뉴 생성)
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
