'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceStatusBadge } from '../../components/InvoiceStatusBadge';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceActions } from './InvoiceActions';
import {
  updateInvoiceStatus,
  confirmInvoice,
  deleteInvoice,
  updateInvoiceItemMatch,
} from '../../actions';
import { useBranch } from '@/contexts/BranchContext';
import type { Invoice, InvoiceItem, ConfirmInvoiceItemInput } from '@/types';

type IngredientOption = {
  id: string;
  ingredient_name: string;
  unit: string;
};

type InvoiceDetailProps = {
  invoice: Invoice;
  ingredients: IngredientOption[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function InvoiceDetail({ invoice, ingredients }: InvoiceDetailProps) {
  const router = useRouter();
  const { user } = useBranch();
  const items = invoice.items ?? [];

  const [confirmedQtys, setConfirmedQtys] = React.useState<
    Record<string, number>
  >(() => {
    const initial: Record<string, number> = {};
    for (const item of items) {
      initial[item.id] = item.confirmed_qty ?? item.quantity;
    }
    return initial;
  });

  const handleMatchChange = async (
    itemId: string,
    ingredientId: string | null,
  ) => {
    try {
      await updateInvoiceItemMatch(itemId, ingredientId);
      router.refresh();
    } catch (error) {
      console.error('Failed to update match:', error);
    }
  };

  const handleConfirmedQtyChange = (itemId: string, qty: number) => {
    setConfirmedQtys((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleStartInspection = async () => {
    await updateInvoiceStatus(invoice.id, 'inspecting');
    router.refresh();
  };

  const handleConfirm = async () => {
    const confirmItems: ConfirmInvoiceItemInput[] = items.map((item) => ({
      invoice_item_id: item.id,
      confirmed_qty: confirmedQtys[item.id] ?? item.quantity,
      matched_ingredient_id: item.matched_ingredient_id ?? null,
    }));

    await confirmInvoice(invoice.id, user?.id ?? 'unknown', confirmItems);
    router.refresh();
  };

  const handleDispute = async () => {
    await updateInvoiceStatus(invoice.id, 'disputed');
    router.refresh();
  };

  const handleDelete = async () => {
    await deleteInvoice(invoice.id);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/invoices' aria-label='목록으로 돌아가기'>
              <ArrowLeft className='h-5 w-5' />
            </Link>
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold'>
                {invoice.invoice_no || `INV-${invoice.id.slice(0, 8)}`}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {invoice.supplier?.name ?? '공급업체 미지정'}
            </p>
          </div>
        </div>

        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status}
          onStartInspection={handleStartInspection}
          onConfirm={handleConfirm}
          onDispute={handleDispute}
          onDelete={handleDelete}
        />
      </div>

      {/* Content: image + metadata */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Image */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>명세서 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.image_url ? (
                <div className='relative aspect-[3/4] w-full overflow-hidden rounded-md border'>
                  <Image
                    src={invoice.image_url}
                    alt='Invoice image'
                    fill
                    className='object-contain'
                    sizes='(max-width: 768px) 100vw, 33vw'
                  />
                </div>
              ) : (
                <div className='bg-muted flex aspect-[3/4] w-full items-center justify-center rounded-md border'>
                  <div className='text-muted-foreground flex flex-col items-center gap-2'>
                    <FileText className='h-12 w-12' />
                    <p className='text-sm'>이미지 없음</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <div className='space-y-6 lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>명세서 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                <div>
                  <dt className='text-muted-foreground text-xs'>명세서번호</dt>
                  <dd className='text-sm font-medium'>
                    {invoice.invoice_no || '-'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>수신일</dt>
                  <dd className='text-sm font-medium'>
                    {formatDate(invoice.invoice_date)}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>공급업체</dt>
                  <dd className='text-sm font-medium'>
                    {invoice.supplier?.name ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>총 금액</dt>
                  <dd className='text-sm font-bold'>
                    {formatCurrency(invoice.total_amount)}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground text-xs'>확인 금액</dt>
                  <dd className='text-sm font-medium'>
                    {invoice.confirmed_amount
                      ? formatCurrency(invoice.confirmed_amount)
                      : '-'}
                  </dd>
                </div>
                {invoice.confirmed_at && (
                  <div>
                    <dt className='text-muted-foreground text-xs'>확인일</dt>
                    <dd className='text-sm font-medium'>
                      {formatDate(invoice.confirmed_at)}
                    </dd>
                  </div>
                )}
              </dl>
              {invoice.notes && (
                <div className='bg-muted mt-4 rounded-md p-3'>
                  <p className='text-muted-foreground text-xs'>비고</p>
                  <p className='mt-1 text-sm'>{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items table */}
          <div>
            <h2 className='mb-3 text-sm font-semibold'>
              품목 목록 ({items.length}건)
            </h2>
            <InvoiceItemsTable
              items={items}
              ingredients={ingredients}
              invoiceStatus={invoice.status}
              onMatchChange={handleMatchChange}
              confirmedQtys={confirmedQtys}
              onConfirmedQtyChange={handleConfirmedQtyChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
