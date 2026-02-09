'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
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
import { SupplierTable } from './SupplierTable';
import { SupplierDialog } from './SupplierDialog';
import {
  createSupplier,
  updateSupplier,
  toggleSupplierActive,
  deleteSupplier,
  type SupplierInput,
} from '../actions';
import { useBranch } from '@/contexts/BranchContext';
import type { Supplier } from '@/types';

type SupplierContentProps = {
  suppliers: Supplier[];
};

export function SupplierContent({ suppliers }: SupplierContentProps) {
  const router = useRouter();
  const { currentBranch } = useBranch();
  const branchId = currentBranch?.id;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editSupplier, setEditSupplier] = React.useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Supplier | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCreate = () => {
    setEditSupplier(null);
    setDialogOpen(true);
  };

  const handleEdit = React.useCallback((supplier: Supplier) => {
    setEditSupplier(supplier);
    setDialogOpen(true);
  }, []);

  const handleToggleActive = React.useCallback(
    async (supplier: Supplier) => {
      const result = await toggleSupplierActive(
        supplier.id,
        supplier.is_active,
      );
      if (!result.success) {
        setErrorMessage(result.error ?? '상태 변경에 실패했습니다.');
        return;
      }
      router.refresh();
    },
    [router],
  );

  const handleDeleteRequest = React.useCallback((supplier: Supplier) => {
    setDeleteTarget(supplier);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await deleteSupplier(deleteTarget.id);
    if (!result.success) {
      setErrorMessage(result.error ?? '삭제에 실패했습니다.');
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    router.refresh();
  };

  const handleSubmit = async (data: SupplierInput) => {
    if (!branchId) {
      throw new Error('지점이 선택되지 않았습니다.');
    }

    if (editSupplier) {
      const result = await updateSupplier(editSupplier.id, data);
      if (!result.success) {
        throw new Error(result.error ?? '수정에 실패했습니다.');
      }
    } else {
      const result = await createSupplier(branchId, data);
      if (!result.success) {
        throw new Error(result.error ?? '등록에 실패했습니다.');
      }
    }
    router.refresh();
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>공급업체 관리</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            거래처 정보를 등록하고 관리합니다.
          </p>
        </div>
        <Button
          className='w-full cursor-pointer sm:w-auto'
          onClick={handleCreate}
        >
          <Plus className='mr-2 h-4 w-4' />
          업체 추가
        </Button>
      </div>

      <SupplierTable
        data={suppliers}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDeleteRequest}
      />

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editSupplier}
        onSubmit={handleSubmit}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공급업체 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.name}&quot;을(를) 삭제하시겠습니까?
              <br />
              삭제된 데이터는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error notification */}
      <AlertDialog
        open={!!errorMessage}
        onOpenChange={(open) => !open && setErrorMessage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>오류</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
