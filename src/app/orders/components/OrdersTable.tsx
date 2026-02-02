'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Check, Trash2, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  updateOrderStatusAction,
  deleteOrderAction,
  receiveOrderAction,
} from '../actions';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types';

type OrdersTableProps = {
  orders: PurchaseOrder[];
};

const statusConfig: Record<
  PurchaseOrderStatus,
  { label: string; className: string }
> = {
  draft: { label: '임시저장', className: 'bg-gray-100 text-gray-700' },
  pending: { label: '승인대기', className: 'bg-yellow-100 text-yellow-700' },
  ordered: { label: '발주완료', className: 'bg-blue-100 text-blue-700' },
  received: { label: '입고완료', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소됨', className: 'bg-red-100 text-red-700' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  const handleStatusChange = async (
    orderId: number,
    status: PurchaseOrderStatus,
  ) => {
    setIsLoading(true);
    const result = await updateOrderStatusAction(orderId, status);
    setIsLoading(false);

    if (result.success) {
      toast.success('발주서 상태가 변경되었습니다.');
    } else {
      toast.error(result.error || '상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!selectedOrderId) return;

    setIsLoading(true);
    const result = await deleteOrderAction(selectedOrderId);
    setIsLoading(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      toast.success('발주서가 삭제되었습니다.');
    } else {
      toast.error(result.error || '삭제에 실패했습니다.');
    }
  };

  const handleReceive = async () => {
    if (!selectedOrderId) return;

    setIsLoading(true);
    const result = await receiveOrderAction(selectedOrderId);
    setIsLoading(false);
    setReceiveDialogOpen(false);

    if (result.success) {
      toast.success('발주 품목이 입고 처리되었습니다.');
    } else {
      toast.error(result.error || '입고 처리에 실패했습니다.');
    }
  };

  return (
    <>
      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>발주번호</TableHead>
              <TableHead>공급처</TableHead>
              <TableHead>발주일</TableHead>
              <TableHead>입고예정일</TableHead>
              <TableHead className='text-right'>총액</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className='w-[50px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.draft;
                return (
                  <TableRow key={order.id}>
                    <TableCell className='font-medium'>
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.supplier || '-'}</TableCell>
                    <TableCell className='tabular-nums'>
                      {formatDate(order.order_date)}
                    </TableCell>
                    <TableCell className='tabular-nums'>
                      {formatDate(order.expected_date)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums font-medium'>
                      {formatCurrency(order.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {order.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() =>
                                order.id &&
                                handleStatusChange(order.id, 'ordered')
                              }
                            >
                              <Check className='mr-2 h-4 w-4' />
                              발주 확정
                            </DropdownMenuItem>
                          )}
                          {order.status === 'ordered' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrderId(order.id || null);
                                setReceiveDialogOpen(true);
                              }}
                            >
                              <Package className='mr-2 h-4 w-4' />
                              입고 처리
                            </DropdownMenuItem>
                          )}
                          {order.status !== 'received' &&
                            order.status !== 'cancelled' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    order.id &&
                                    handleStatusChange(order.id, 'cancelled')
                                  }
                                  className='text-orange-600'
                                >
                                  취소
                                </DropdownMenuItem>
                              </>
                            )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrderId(order.id || null);
                              setDeleteDialogOpen(true);
                            }}
                            className='text-red-600'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center'>
                  등록된 발주서가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>발주서 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 발주서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-red-500 hover:bg-red-600'
              disabled={isLoading}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 입고 확인 다이얼로그 */}
      <AlertDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입고 처리</AlertDialogTitle>
            <AlertDialogDescription>
              이 발주서의 품목들을 입고 처리하시겠습니까? 재고가 자동으로
              증가합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReceive} disabled={isLoading}>
              입고 처리
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
