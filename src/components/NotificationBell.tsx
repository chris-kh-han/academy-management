'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  FileText,
  CheckCircle2,
  AlertTriangle,
  PackageX,
  Info,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBranch } from '@/contexts/BranchContext';
import type { Notification, NotificationType } from '@/types';

const POLL_INTERVAL_MS = 30_000;

const NOTIFICATION_ICON_MAP: Record<
  NotificationType,
  { icon: typeof Bell; className: string }
> = {
  invoice_received: { icon: FileText, className: 'text-blue-500' },
  invoice_confirmed: { icon: CheckCircle2, className: 'text-green-500' },
  invoice_disputed: { icon: AlertTriangle, className: 'text-amber-500' },
  low_stock: { icon: PackageX, className: 'text-red-500' },
  system: { icon: Info, className: 'text-slate-500' },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string, link?: string | null) => void;
}) {
  const config = NOTIFICATION_ICON_MAP[notification.type] ?? {
    icon: Info,
    className: 'text-slate-500',
  };
  const Icon = config.icon;

  return (
    <button
      type='button'
      onClick={() => onRead(notification.id, notification.link)}
      className='hover:bg-accent flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors'
    >
      <span
        className={cn(
          'bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          config.className,
        )}
      >
        <Icon className='h-4 w-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{notification.title}</p>
        {notification.message && (
          <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>
            {notification.message}
          </p>
        )}
        <p className='text-muted-foreground/70 mt-1 text-[11px]'>
          {formatRelativeTime(notification.created_at ?? '')}
        </p>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const router = useRouter();
  const { user, currentBranch } = useBranch();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const branchId = currentBranch?.id;

  const fetchNotifications = useCallback(async () => {
    if (!branchId) return;

    try {
      const res = await fetch(
        `/api/notifications?branchId=${encodeURIComponent(branchId)}`,
      );
      if (!res.ok) return;

      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch {
      // Silently fail on poll errors — next poll will retry
    }
  }, [branchId]);

  // Initial fetch + polling
  useEffect(() => {
    if (!user || !branchId) return;

    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    pollTimerRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [user, branchId, fetchNotifications]);

  // Refetch when popover opens
  useEffect(() => {
    if (isOpen && branchId) {
      fetchNotifications();
    }
  }, [isOpen, branchId, fetchNotifications]);

  const handleReadNotification = async (
    notificationId: string,
    link?: string | null,
  ) => {
    // Optimistically remove from list
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
    } catch {
      // Refetch on failure to restore state
      fetchNotifications();
    }

    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  };

  const handleMarkAllRead = async () => {
    if (!branchId || notifications.length === 0) return;

    setIsMarkingAll(true);
    // Optimistically clear
    const previousNotifications = notifications;
    setNotifications([]);

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId }),
      });

      if (!res.ok) {
        setNotifications(previousNotifications);
      }
    } catch {
      setNotifications(previousNotifications);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label={`알림 ${unreadCount > 0 ? `${unreadCount}건` : '없음'}`}
        >
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' sideOffset={8} className='w-80 p-0 sm:w-96'>
        {/* Header */}
        <div className='flex items-center justify-between border-b px-4 py-3'>
          <h3 className='text-sm font-semibold'>알림</h3>
          {unreadCount > 0 && (
            <button
              type='button'
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className='text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors disabled:opacity-50'
            >
              {isMarkingAll ? (
                <Loader2 className='h-3 w-3 animate-spin' />
              ) : (
                <CheckCheck className='h-3 w-3' />
              )}
              모두 읽음
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className='max-h-80 overflow-y-auto'>
          {isLoading && notifications.length === 0 ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center justify-center py-8'>
              <Bell className='mb-2 h-8 w-8 opacity-30' />
              <p className='text-sm'>새로운 알림이 없습니다</p>
            </div>
          ) : (
            <div className='divide-y'>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleReadNotification}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
