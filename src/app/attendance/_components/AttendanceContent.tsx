'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { UserPermission, WorkRecord } from '@/types';

type AttendanceContentProps = {
  users: UserPermission[];
  initialWorkRecords: WorkRecord[];
  initialDateRange: {
    startDate: string;
    endDate: string;
  };
};

export default function AttendanceContent({
  users,
  initialWorkRecords,
  initialDateRange,
}: AttendanceContentProps) {
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>(initialWorkRecords);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<WorkRecord> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 필터링된 근무 기록
  const filteredRecords = workRecords.filter((record) => {
    if (selectedUser !== 'all' && record.user_id !== selectedUser) return false;
    return true;
  });

  // 통계 계산
  const stats = {
    totalRecords: filteredRecords.length,
    totalMinutes: filteredRecords.reduce((sum, r) => sum + (r.work_minutes || 0), 0),
    totalOvertime: filteredRecords.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0),
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const handleDateChange = async () => {
    try {
      const res = await fetch(
        `/api/attendance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}${selectedUser !== 'all' ? `&userId=${selectedUser}` : ''}`,
      );
      if (res.ok) {
        const data = await res.json();
        setWorkRecords(data);
      }
    } catch (error) {
      console.error('Error fetching work records:', error);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord({
      user_id: users[0]?.user_id || '',
      work_date: new Date().toISOString().split('T')[0],
      clock_in: '09:00',
      clock_out: '18:00',
      break_minutes: 60,
      overtime_minutes: 0,
      is_holiday: false,
      status: 'pending',
      note: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditRecord = (record: WorkRecord) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!editingRecord?.user_id || !editingRecord?.work_date || !editingRecord?.clock_in) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const method = editingRecord.id ? 'PUT' : 'POST';
      const res = await fetch('/api/attendance', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecord),
      });

      if (res.ok) {
        const savedRecord = await res.json();
        if (editingRecord.id) {
          setWorkRecords(workRecords.map((r) => (r.id === savedRecord.id ? savedRecord : r)));
        } else {
          setWorkRecords([savedRecord, ...workRecords]);
        }
        setIsDialogOpen(false);
        setEditingRecord(null);
        toast.success('저장되었습니다.');
      } else {
        toast.error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteRecordId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/attendance?id=${deleteRecordId}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkRecords(workRecords.filter((r) => r.id !== deleteRecordId));
        toast.success('삭제되었습니다.');
      } else {
        toast.error('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteRecordId(null);
    }
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.user_id === userId)?.user_name || userId;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: '대기',
      approved: '승인',
      rejected: '반려',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">근태 관리</h1>
          <p className="text-gray-500">직원들의 출퇴근 기록을 관리합니다.</p>
        </div>
        <Button onClick={handleAddRecord}>근무 기록 추가</Button>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>직원</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleDateChange}>조회</Button>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 근무일</CardDescription>
            <CardTitle className="text-2xl">{stats.totalRecords}일</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 근무시간</CardDescription>
            <CardTitle className="text-2xl">{formatMinutes(stats.totalMinutes)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 연장근무</CardDescription>
            <CardTitle className="text-2xl">{formatMinutes(stats.totalOvertime)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 근무 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>근무 기록</CardTitle>
          <CardDescription>
            {dateRange.startDate} ~ {dateRange.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">근무 기록이 없습니다.</p>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>출근</TableHead>
                    <TableHead>퇴근</TableHead>
                    <TableHead>휴게</TableHead>
                    <TableHead>근무시간</TableHead>
                    <TableHead>연장</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.work_date}</TableCell>
                      <TableCell className="font-medium">
                        {record.user_name || getUserName(record.user_id)}
                      </TableCell>
                      <TableCell>{record.clock_in}</TableCell>
                      <TableCell>{record.clock_out || '-'}</TableCell>
                      <TableCell>{record.break_minutes}분</TableCell>
                      <TableCell>{formatMinutes(record.work_minutes || 0)}</TableCell>
                      <TableCell>
                        {record.overtime_minutes > 0
                          ? formatMinutes(record.overtime_minutes)
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRecord(record)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteRecordId(record.id!)}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRecord?.id ? '근무 기록 수정' : '근무 기록 추가'}</DialogTitle>
            <DialogDescription>근무 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>직원</Label>
                  <Select
                    value={editingRecord.user_id}
                    onValueChange={(v) => setEditingRecord({ ...editingRecord, user_id: v })}
                    disabled={!!editingRecord.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="직원 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>날짜</Label>
                  <Input
                    type="date"
                    value={editingRecord.work_date}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, work_date: e.target.value })
                    }
                    disabled={!!editingRecord.id}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>출근 시간</Label>
                  <Input
                    type="time"
                    value={editingRecord.clock_in}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, clock_in: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>퇴근 시간</Label>
                  <Input
                    type="time"
                    value={editingRecord.clock_out || ''}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, clock_out: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>휴게 시간 (분)</Label>
                  <Input
                    type="number"
                    value={editingRecord.break_minutes}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        break_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>연장 근무 (분)</Label>
                  <Input
                    type="number"
                    value={editingRecord.overtime_minutes}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        overtime_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>비고</Label>
                <Input
                  value={editingRecord.note || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, note: e.target.value })}
                  placeholder="메모"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveRecord} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRecordId} onOpenChange={(open) => !open && setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>근무 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 근무 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
