'use client';

import * as React from 'react';
import { Plus, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MovementsTable } from '../../components/MovementsTable';
import { MovementsSummary } from '../../components/MovementsSummary';
import { MovementFormDialog } from '../../components/MovementFormDialog';
import { InvoiceScanDialog } from '../../components/InvoiceScanDialog';
import type { StockMovement, MovementType } from '@/types';

type MovementsContentProps = {
  ingredients: {
    id: string;
    name: string;
    unit: string;
    current_qty: number;
  }[];
  movements: StockMovement[];
  summary: {
    incoming: number;
    outgoing: number;
    waste: number;
    adjustment: number;
  };
};

export function MovementsContent({
  ingredients,
  movements,
  summary,
}: MovementsContentProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<MovementType>('in');
  const [movementTypeFilter, setMovementTypeFilter] = React.useState('all');
  const [invoiceScanOpen, setInvoiceScanOpen] = React.useState(false);

  const handleOpenMovementDialog = (type: MovementType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleSummaryCardClick = (type: MovementType) => {
    setMovementTypeFilter(type);
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>입출고 관리</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            재고 입출고 내역을 확인하고 관리합니다.
          </p>
        </div>
        <div className='flex flex-col gap-2 w-full sm:flex-row sm:w-auto'>
          <Button
            variant='outline'
            className='w-full sm:w-auto py-3 sm:py-2 cursor-pointer'
            onClick={() => setInvoiceScanOpen(true)}
          >
            <ScanLine className='mr-2 h-4 w-4' />
            명세서 스캔
          </Button>
          <Button
            className='w-full sm:w-[160px] py-3 sm:py-2 cursor-pointer'
            onClick={() => handleOpenMovementDialog('in')}
          >
            <Plus className='mr-2 h-4 w-4' />
            재고 이동 등록
          </Button>
        </div>
      </div>

      <InvoiceScanDialog
        ingredients={ingredients}
        open={invoiceScanOpen}
        onOpenChange={setInvoiceScanOpen}
      />

      <MovementsSummary
        summary={summary}
        onCardClick={handleSummaryCardClick}
      />

      <MovementsTable
        data={movements}
        typeFilter={movementTypeFilter}
        onTypeFilterChange={setMovementTypeFilter}
      />

      <MovementFormDialog
        ingredients={ingredients}
        defaultType={dialogType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
