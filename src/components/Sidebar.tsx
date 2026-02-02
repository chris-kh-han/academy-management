'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  Package,
  PackagePlus,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Settings,
  ClipboardCheck,
} from 'lucide-react';
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
  adminOnly?: boolean;
  hidden?: boolean;
};

const menuItems: MenuItem[] = [
  { label: '대시보드', path: '/dashboard', icon: <LayoutDashboard className='w-4 h-4' /> },
  { label: '재고 현황', path: '/inventory', icon: <Package className='w-4 h-4' /> },
  { label: '재료 관리', path: '/inventory/ingredients', icon: <Warehouse className='w-4 h-4' /> },
  { label: '입출고 관리', path: '/inventory/movements', icon: <PackagePlus className='w-4 h-4' /> },
  { label: '마감 체크', path: '/closing', icon: <ClipboardCheck className='w-4 h-4' /> },
  { label: '발주 관리', path: '/orders', icon: <ShoppingCart className='w-4 h-4' /> },
  { label: '재고 예측', path: '/inventory/forecast', icon: <TrendingUp className='w-4 h-4' /> },
  { label: '판매 기록', path: '/sales', icon: <BarChart3 className='w-4 h-4' /> },
  { label: '리포트', path: '/reports', icon: <BarChart3 className='w-4 h-4' /> },
  { label: '설정', path: '/settings', icon: <Settings className='w-4 h-4' /> },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { userRole } = useBranch();

  // owner 또는 admin인지 확인
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  // 역할에 따라 메뉴 필터링 + 숨김 처리
  const visibleMenus = menuItems.filter((menu) => {
    if (menu.hidden) return false;
    if (menu.adminOnly && !isOwnerOrAdmin) return false;
    return true;
  });

  // 현재 pathname에 가장 구체적으로 매칭되는 메뉴 찾기
  const activePath = useMemo(() => {
    if (!pathname) return null;

    // 정확히 일치하는 경로 우선
    const exactMatch = visibleMenus.find((m) => m.path === pathname);
    if (exactMatch) return exactMatch.path;

    // 그 다음, 가장 긴 prefix 매칭 (가장 구체적인 경로)
    const prefixMatches = visibleMenus
      .filter((m) => pathname.startsWith(m.path + '/'))
      .sort((a, b) => b.path.length - a.path.length);

    return prefixMatches[0]?.path ?? null;
  }, [pathname, visibleMenus]);

  return (
    <Sidebar>
      <SidebarHeader>
        {visibleMenus.map((menu) => {
          const isActive = menu.path === activePath;
          return (
            <Link
              key={menu.path}
              href={menu.path}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'px-4 py-3 rounded-lg border cursor-pointer transition-colors duration-200 flex items-center gap-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground hover:bg-orange-100/50 hover:text-orange-600',
                'border-border',
              )}
            >
              {menu.icon}
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
