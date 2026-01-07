'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useBranch } from '@/contexts/BranchContext';
import { signOut } from '@/app/auth/actions';

type MenuItem = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean; // owner/admin만 볼 수 있는 메뉴
};

const menuItems: MenuItem[] = [
  { label: '대시보드', path: '/dashboard' },
  { label: '재고 관리', path: '/inventory' },
  { label: '메뉴/레서피', path: '/recipes' },
  { label: '판매 관리', path: '/sales' },
  { label: '리포트', path: '/reports' },
  // { label: '근태 관리', path: '/attendance' },
  // { label: '급여 관리', path: '/payroll' },
  { label: '설정', path: '/settings' },
  { label: '초기 설정', path: '/setup', adminOnly: true },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { userRole } = useBranch();

  // owner 또는 admin인지 확인
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  // 역할에 따라 메뉴 필터링
  const visibleMenus = menuItems.filter((menu) => {
    if (menu.adminOnly && !isOwnerOrAdmin) return false;
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader>
        {visibleMenus.map((menu) => {
          const isActive =
            pathname === menu.path || pathname?.startsWith(menu.path + '/');
          return (
            <Link
              key={menu.path}
              href={menu.path}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'px-4 py-3 rounded-lg border cursor-pointer transition-colors duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground hover:bg-orange-100/50 hover:text-orange-600',
                'border-border',
              )}
            >
              {menu.label}
            </Link>
          );
        })}
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter className='p-4'>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type='button'
              className='
                w-full px-4 py-3 rounded-lg border cursor-pointer
                bg-card text-card-foreground
                hover:bg-red-50 hover:text-red-600 hover:border-red-200
                border-border
                transition-colors duration-200
                flex items-center justify-center gap-2
              '
            >
              <LogOut className='w-4 h-4' />
              로그아웃
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>로그아웃</AlertDialogTitle>
              <AlertDialogDescription>
                정말 로그아웃 하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <form action={signOut}>
                <AlertDialogAction type='submit' className='bg-red-500 hover:bg-red-600'>
                  로그아웃
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
