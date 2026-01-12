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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserPermission, Payroll, SalarySetting } from '@/types';

type PayrollContentProps = {
  users: UserPermission[];
  initialPayrolls: Payroll[];
  salarySettings: SalarySetting[];
  initialYear: number;
  initialMonth: number;
};

export default function PayrollContent({
  users,
  initialPayrolls,
  salarySettings: initialSalarySettings,
  initialYear,
  initialMonth,
}: PayrollContentProps) {
  const [payrolls, setPayrolls] = useState<Payroll[]>(initialPayrolls);
  const [salarySettings, setSalarySettings] = useState<SalarySetting[]>(initialSalarySettings);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Partial<SalarySetting> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 통계 계산
  const stats = {
    totalPayroll: payrolls.reduce((sum, p) => sum + p.net_pay, 0),
    confirmedCount: payrolls.filter((p) => p.status === 'confirmed').length,
    paidCount: payrolls.filter((p) => p.status === 'paid').length,
    draftCount: payrolls.filter((p) => p.status === 'draft').length,
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const handleDateChange = async () => {
    try {
      const res = await fetch(`/api/payroll?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    }
  };

  const handleCalculatePayroll = async (userId: string) => {
    setIsCalculating(true);
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, periodStart: startDate, periodEnd: endDate }),
      });

      if (res.ok) {
        const newPayroll = await res.json();
        const existingIndex = payrolls.findIndex(
          (p) => p.user_id === userId && p.pay_period_start === startDate,
        );
        if (existingIndex >= 0) {
          setPayrolls(payrolls.map((p, i) => (i === existingIndex ? newPayroll : p)));
        } else {
          setPayrolls([newPayroll, ...payrolls]);
        }
        toast.success('급여가 계산되었습니다.');
      } else {
        toast.error('급여 계산에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error('급여 계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'confirmed' | 'paid') => {
    try {
      const res = await fetch('/api/payroll/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          paidAt: status === 'paid' ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setPayrolls(
          payrolls.map((p) =>
            p.id === id
              ? { ...p, status, paid_at: status === 'paid' ? new Date().toISOString() : undefined }
              : p,
          ),
        );
        toast.success(status === 'confirmed' ? '확정되었습니다.' : '지급 처리되었습니다.');
      } else {
        toast.error('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleEditSalary = (userId: string) => {
    const existing = salarySettings.find((s) => s.user_id === userId);
    setEditingSalary(
      existing || {
        user_id: userId,
        salary_type: 'hourly',
        hourly_rate: 9860,
        overtime_rate: 1.5,
        night_rate: 1.5,
        weekend_rate: 1.5,
      },
    );
    setIsSalaryDialogOpen(true);
  };

  const handleSaveSalary = async () => {
    if (!editingSalary?.user_id) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/payroll/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSalary),
      });

      if (res.ok) {
        const existingIndex = salarySettings.findIndex((s) => s.user_id === editingSalary.user_id);
        if (existingIndex >= 0) {
          setSalarySettings(
            salarySettings.map((s, i) => (i === existingIndex ? (editingSalary as SalarySetting) : s)),
          );
        } else {
          setSalarySettings([...salarySettings, editingSalary as SalarySetting]);
        }
        setIsSalaryDialogOpen(false);
        setEditingSalary(null);
        toast.success('저장되었습니다.');
      } else {
        toast.error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.user_id === userId)?.user_name || userId;
  };

  const getUserSalary = (userId: string) => {
    return salarySettings.find((s) => s.user_id === userId);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      draft: '초안',
      confirmed: '확정',
      paid: '지급완료',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">급여 관리</h1>
        <p className="text-gray-500">직원들의 급여를 계산하고 관리합니다.</p>
      </div>

      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="payroll">급여 내역</TabsTrigger>
          <TabsTrigger value="settings">급여 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          {/* 필터 */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>연도</Label>
                  <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>월</Label>
                  <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m}월
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>총 급여 지출</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(stats.totalPayroll)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>초안</CardDescription>
                <CardTitle className="text-2xl">{stats.draftCount}건</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>확정</CardDescription>
                <CardTitle className="text-2xl">{stats.confirmedCount}건</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardDescription>지급 완료</CardDescription>
                <CardTitle className="text-2xl text-green-600">{stats.paidCount}건</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 급여 계산 버튼 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>급여 계산</CardTitle>
              <CardDescription>직원을 선택하여 {month}월 급여를 계산합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <Button
                    key={user.user_id}
                    variant="outline"
                    onClick={() => handleCalculatePayroll(user.user_id)}
                    disabled={isCalculating}
                  >
                    {user.user_name} 급여 계산
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 급여 내역 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle>급여 내역</CardTitle>
              <CardDescription>
                {year}년 {month}월
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payrolls.length === 0 ? (
                <p className="text-center text-gray-500 py-8">급여 내역이 없습니다.</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>이름</TableHead>
                        <TableHead>기간</TableHead>
                        <TableHead className="text-right">근무일</TableHead>
                        <TableHead className="text-right">근무시간</TableHead>
                        <TableHead className="text-right">기본급</TableHead>
                        <TableHead className="text-right">연장수당</TableHead>
                        <TableHead className="text-right">실수령액</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">
                            {payroll.user_name || getUserName(payroll.user_id)}
                          </TableCell>
                          <TableCell>
                            {payroll.pay_period_start} ~ {payroll.pay_period_end}
                          </TableCell>
                          <TableCell className="text-right">{payroll.total_work_days}일</TableCell>
                          <TableCell className="text-right">
                            {formatMinutes(payroll.total_work_minutes)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payroll.base_pay)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(payroll.overtime_pay)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(payroll.net_pay)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {payroll.status === 'draft' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(payroll.id!, 'confirmed')}
                                >
                                  확정
                                </Button>
                              )}
                              {payroll.status === 'confirmed' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(payroll.id!, 'paid')}
                                >
                                  지급
                                </Button>
                              )}
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
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>직원별 급여 설정</CardTitle>
              <CardDescription>각 직원의 시급/월급 정보를 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>급여 유형</TableHead>
                    <TableHead className="text-right">시급</TableHead>
                    <TableHead className="text-right">월급</TableHead>
                    <TableHead className="text-right">연장 배율</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const salary = getUserSalary(user.user_id);
                    return (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">{user.user_name}</TableCell>
                        <TableCell>
                          {salary?.salary_type === 'monthly' ? '월급제' : '시급제'}
                        </TableCell>
                        <TableCell className="text-right">
                          {salary?.hourly_rate?.toLocaleString() || '-'}원
                        </TableCell>
                        <TableCell className="text-right">
                          {salary?.monthly_salary?.toLocaleString() || '-'}원
                        </TableCell>
                        <TableCell className="text-right">{salary?.overtime_rate || 1.5}배</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSalary(user.user_id)}
                          >
                            설정
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 급여 설정 다이얼로그 */}
      <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>급여 설정</DialogTitle>
            <DialogDescription>
              {editingSalary?.user_id && getUserName(editingSalary.user_id)}님의 급여 정보를
              설정합니다.
            </DialogDescription>
          </DialogHeader>
          {editingSalary && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>급여 유형</Label>
                <Select
                  value={editingSalary.salary_type}
                  onValueChange={(v) =>
                    setEditingSalary({ ...editingSalary, salary_type: v as 'hourly' | 'monthly' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">시급제</SelectItem>
                    <SelectItem value="monthly">월급제</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시급 (원)</Label>
                  <Input
                    type="number"
                    value={editingSalary.hourly_rate}
                    onChange={(e) =>
                      setEditingSalary({
                        ...editingSalary,
                        hourly_rate: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>월급 (원)</Label>
                  <Input
                    type="number"
                    value={editingSalary.monthly_salary || ''}
                    onChange={(e) =>
                      setEditingSalary({
                        ...editingSalary,
                        monthly_salary: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="월급제인 경우"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>연장 배율</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingSalary.overtime_rate}
                    onChange={(e) =>
                      setEditingSalary({
                        ...editingSalary,
                        overtime_rate: parseFloat(e.target.value) || 1.5,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>야간 배율</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingSalary.night_rate}
                    onChange={(e) =>
                      setEditingSalary({
                        ...editingSalary,
                        night_rate: parseFloat(e.target.value) || 1.5,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>주말 배율</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingSalary.weekend_rate}
                    onChange={(e) =>
                      setEditingSalary({
                        ...editingSalary,
                        weekend_rate: parseFloat(e.target.value) || 1.5,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaryDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveSalary} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
