'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
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
import type { UserPermission, UserRole } from '@/types';

interface UserPermissionsFormProps {
  initialData: UserPermission[];
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: '관리자', description: '모든 기능에 접근 가능' },
  { value: 'manager', label: '매니저', description: '설정 외 모든 기능 접근 가능' },
  { value: 'staff', label: '직원', description: '대시보드, 재고, 레시피 접근 가능' },
  { value: 'viewer', label: '열람자', description: '대시보드, 리포트만 접근 가능' },
];

const defaultPermissionsByRole: Record<UserRole, Omit<UserPermission, 'id' | 'user_id' | 'user_email' | 'user_name' | 'role' | 'created_at' | 'updated_at'>> = {
  admin: {
    can_access_dashboard: true,
    can_access_inventory: true,
    can_access_recipes: true,
    can_access_reports: true,
    can_access_settings: true,
  },
  manager: {
    can_access_dashboard: true,
    can_access_inventory: true,
    can_access_recipes: true,
    can_access_reports: true,
    can_access_settings: false,
  },
  staff: {
    can_access_dashboard: true,
    can_access_inventory: true,
    can_access_recipes: true,
    can_access_reports: false,
    can_access_settings: false,
  },
  viewer: {
    can_access_dashboard: true,
    can_access_inventory: false,
    can_access_recipes: false,
    can_access_reports: true,
    can_access_settings: false,
  },
};

export default function UserPermissionsForm({ initialData }: UserPermissionsFormProps) {
  const [users, setUsers] = useState<UserPermission[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPermission | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newUser, setNewUser] = useState<Partial<UserPermission>>({
    user_email: '',
    user_name: '',
    role: 'staff',
    ...defaultPermissionsByRole['staff'],
  });

  const handleRoleChange = (role: UserRole) => {
    const permissions = defaultPermissionsByRole[role];
    if (editingUser) {
      setEditingUser({ ...editingUser, role, ...permissions });
    } else {
      setNewUser({ ...newUser, role, ...permissions });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.user_email || !newUser.user_name) {
      toast.error('이메일과 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          user_id: `user_${Date.now()}`,
        }),
      });

      if (response.ok) {
        const savedUser = await response.json();
        setUsers([...users, savedUser]);
        setNewUser({
          user_email: '',
          user_name: '',
          role: 'staff',
          ...defaultPermissionsByRole['staff'],
        });
        setIsDialogOpen(false);
        toast.success('사용자가 추가되었습니다.');
      } else {
        toast.error('사용자 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('사용자 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/settings/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      if (response.ok) {
        setUsers(users.map(u => u.user_id === editingUser.user_id ? editingUser : u));
        setEditingUser(null);
        toast.success('권한이 수정되었습니다.');
      } else {
        toast.error('권한 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('권한 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/settings/users?userId=${deleteUserId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.user_id !== deleteUserId));
        toast.success('사용자가 삭제되었습니다.');
      } else {
        toast.error('사용자 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('사용자 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteUserId(null);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return roleOptions.find(r => r.value === role)?.label || role;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>사용자/권한 관리</CardTitle>
            <CardDescription>팀원들의 접근 권한을 관리합니다.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>사용자 추가</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 사용자 추가</DialogTitle>
                <DialogDescription>
                  새로운 팀원을 추가하고 권한을 설정합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new_user_name" className="text-xs text-muted-foreground">이름</Label>
                  <Input
                    id="new_user_name"
                    value={newUser.user_name || ''}
                    onChange={(e) => setNewUser({ ...newUser, user_name: e.target.value })}
                    placeholder="이름을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_user_email" className="text-xs text-muted-foreground">이메일</Label>
                  <Input
                    id="new_user_email"
                    type="email"
                    value={newUser.user_email || ''}
                    onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_user_role" className="text-xs text-muted-foreground">역할</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => handleRoleChange(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <span className="font-medium">{option.label}</span>
                            <span className="ml-2 text-muted-foreground text-xs">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleAddUser} disabled={isSaving}>
                  {isSaving ? '추가 중...' : '추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 사용자가 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead className="text-center">대시보드</TableHead>
                <TableHead className="text-center">재고</TableHead>
                <TableHead className="text-center">레시피</TableHead>
                <TableHead className="text-center">리포트</TableHead>
                <TableHead className="text-center">설정</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.user_name}</TableCell>
                  <TableCell>{user.user_email}</TableCell>
                  <TableCell>{getRoleLabel(user.role)}</TableCell>
                  <TableCell className="text-center">
                    {user.can_access_dashboard ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.can_access_inventory ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.can_access_recipes ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.can_access_reports ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.can_access_settings ? '✓' : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteUserId(user.user_id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>권한 수정</DialogTitle>
              <DialogDescription>
                {editingUser?.user_name}님의 권한을 수정합니다.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">역할</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => handleRoleChange(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">세부 권한</Label>
                  <div className="space-y-2">
                    {[
                      { key: 'can_access_dashboard', label: '대시보드' },
                      { key: 'can_access_inventory', label: '재고 관리' },
                      { key: 'can_access_recipes', label: '레시피 관리' },
                      { key: 'can_access_reports', label: '리포트' },
                      { key: 'can_access_settings', label: '설정' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{label}</span>
                        <Switch
                          checked={editingUser[key as keyof UserPermission] as boolean}
                          onCheckedChange={(checked) =>
                            setEditingUser({ ...editingUser, [key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                취소
              </Button>
              <Button onClick={handleUpdateUser} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                이 사용자를 삭제하시겠습니까? 삭제된 사용자는 복구할 수 없습니다.
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
      </CardContent>
    </Card>
  );
}
