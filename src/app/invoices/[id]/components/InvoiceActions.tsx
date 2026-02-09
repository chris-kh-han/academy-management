'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  AlertTriangle,
  Trash2,
  Play,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { InvoiceStatus } from '@/types';

type InvoiceActionsProps = {
  invoiceId: string;
  status: InvoiceStatus;
  onStartInspection: () => Promise<void>;
  onConfirm: () => Promise<void>;
  onDispute: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function InvoiceActions({
  invoiceId,
  status,
  onStartInspection,
  onConfirm,
  onDispute,
  onDelete,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleAction = async (action: () => Promise<void>, key: string) => {
    setIsLoading(key);
    try {
      await action();
    } catch (error) {
      console.error(`Action ${key} failed:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap'>
      {status === 'received' && (
        <Button
          onClick={() => handleAction(onStartInspection, 'inspect')}
          disabled={isLoading !== null}
          className='cursor-pointer'
        >
          {isLoading === 'inspect' ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <Play className='mr-2 h-4 w-4' />
          )}
          검수 시작
        </Button>
      )}

      {status === 'inspecting' && (
        <>
          <Button
            onClick={() => handleAction(onConfirm, 'confirm')}
            disabled={isLoading !== null}
            className='cursor-pointer bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
          >
            {isLoading === 'confirm' ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <ClipboardCheck className='mr-2 h-4 w-4' />
            )}
            확인 (재고 반영)
          </Button>
          <Button
            variant='outline'
            onClick={() => handleAction(onDispute, 'dispute')}
            disabled={isLoading !== null}
            className='cursor-pointer border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
          >
            {isLoading === 'dispute' ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <AlertTriangle className='mr-2 h-4 w-4' />
            )}
            이의 제기
          </Button>
        </>
      )}

      {(status === 'received' || status === 'disputed') && (
        <Button
          variant='outline'
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isLoading !== null}
          className='cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          삭제
        </Button>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>명세서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 거래명세서를 삭제하시겠습니까?
              <br />
              삭제된 데이터는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleAction(async () => {
                  await onDelete();
                  router.push('/invoices');
                }, 'delete');
              }}
              className='bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
