'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InvoiceStatus, DeliveryStatus } from '@/types';

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  received: {
    label: '수신',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  inspecting: {
    label: '검수중',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  confirmed: {
    label: '확인',
    className:
      'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  },
  disputed: {
    label: '이의',
    className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  },
};

const DELIVERY_CONFIG: Record<
  DeliveryStatus,
  { label: string; className: string }
> = {
  pending: {
    label: '대기',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  delivered: {
    label: '완료',
    className:
      'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  },
  partial: {
    label: '일부',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  },
};

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
  className?: string;
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant='secondary' className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

type DeliveryStatusBadgeProps = {
  status: DeliveryStatus;
  className?: string;
};

export function DeliveryStatusBadge({
  status,
  className,
}: DeliveryStatusBadgeProps) {
  const config = DELIVERY_CONFIG[status];
  return (
    <Badge variant='secondary' className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
