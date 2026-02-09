import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { Invoice, InvoiceStatus } from '@/types';

type Props = {
  invoices: Invoice[];
};

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  received: {
    label: '수신',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  inspecting: {
    label: '검수중',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: '확인완료',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  disputed: {
    label: '이의제기',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export default function RecentInvoices({ invoices }: Props) {
  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <FileText className='h-4 w-4 text-blue-500' />
          최근 명세서
        </CardTitle>
        <Link href='/invoices'>
          <Button variant='ghost' size='sm' className='cursor-pointer text-xs'>
            전체보기
            <ArrowRight className='ml-1 h-3 w-3' />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <div className='space-y-3'>
            {invoices.map((invoice) => {
              const statusConfig = STATUS_CONFIG[invoice.status];
              const supplierName =
                invoice.supplier?.name ?? '알 수 없는 공급업체';

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className='bg-muted/50 hover:bg-muted flex items-center justify-between rounded-lg p-3 transition-colors'
                >
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate text-sm font-medium'>
                        {supplierName}
                      </p>
                      <Badge
                        variant='outline'
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      {invoice.received_at
                        ? formatRelativeTime(invoice.received_at)
                        : '-'}
                      {invoice.invoice_no && (
                        <span className='ml-2'>#{invoice.invoice_no}</span>
                      )}
                    </p>
                  </div>
                  <span className='ml-2 shrink-0 text-sm font-semibold'>
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
            <div className='mb-3 rounded-full bg-blue-100 p-3'>
              <FileText className='h-5 w-5 text-blue-600' />
            </div>
            <p className='text-sm'>수신된 명세서가 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
