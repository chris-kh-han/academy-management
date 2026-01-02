'use client';

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
import { AlertTriangle } from 'lucide-react';

type DuplicateConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  duplicates: number;
  newRecords: number;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function DuplicateConfirmDialog({
  open,
  onOpenChange,
  total,
  duplicates,
  newRecords,
  onConfirm,
  isLoading,
}: DuplicateConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            중복 데이터 발견
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                업로드할 <strong>{total}건</strong> 중{' '}
                <strong className="text-amber-600 dark:text-amber-400">{duplicates}건</strong>이
                이미 존재합니다.
              </p>
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>신규 저장:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{newRecords}건</span>
                </div>
                <div className="flex justify-between">
                  <span>덮어쓰기:</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{duplicates}건</span>
                </div>
              </div>
              <p className="text-muted-foreground">
                계속 진행하면 기존 데이터가 덮어쓰기됩니다.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                업로드 중...
              </>
            ) : (
              '덮어쓰기'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
