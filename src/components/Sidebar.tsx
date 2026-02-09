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
  FileText,
  ScanLine,
  Truck,
  Receipt,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
  section: string;
};

const SECTION_ORDER = ['메인', '거래명세서', '재고 관리', '분석', '시스템'];

const menuItems: MenuItem[] = [
  // === 메인 ===
  {
    label: '대시보드',
    path: '/dashboard',
    icon: <LayoutDashboard className='h-4 w-4' />,
    section: '메인',
  },

  // === 거래명세서 ===
  {
    label: '명세서 수신함',
    path: '/invoices',
    icon: <FileText className='h-4 w-4' />,
    section: '거래명세서',
  },
  {
    label: '명세서 스캔',
    path: '/invoices/scan',
    icon: <ScanLine className='h-4 w-4' />,
    section: '거래명세서',
  },
  {
    label: '공급업체 관리',
    path: '/suppliers',
    icon: <Truck className='h-4 w-4' />,
    section: '거래명세서',
  },

  // === 재고 관리 ===
  {
    label: '재고 현황',
    path: '/inventory',
    icon: <Package className='h-4 w-4' />,
    section: '재고 관리',
  },
  {
    label: '재료 관리',
    path: '/inventory/ingredients',
    icon: <Warehouse className='h-4 w-4' />,
    section: '재고 관리',
  },
  {
    label: '입출고 관리',
    path: '/inventory/movements',
    icon: <PackagePlus className='h-4 w-4' />,
    section: '재고 관리',
  },
  {
    label: '마감 체크',
    path: '/closing',
    icon: <ClipboardCheck className='h-4 w-4' />,
    section: '재고 관리',
  },

  // === 분석 ===
  {
    label: '발주 관리',
    path: '/orders',
    icon: <ShoppingCart className='h-4 w-4' />,
    section: '분석',
  },
  {
    label: '재고 예측',
    path: '/inventory/forecast',
    icon: <TrendingUp className='h-4 w-4' />,
    section: '분석',
  },
  {
    label: '판매 기록',
    path: '/sales',
    icon: <BarChart3 className='h-4 w-4' />,
    section: '분석',
    hidden: true,
  },
  {
    label: '리포트',
    path: '/reports',
    icon: <BarChart3 className='h-4 w-4' />,
    section: '분석',
  },

  // === 시스템 ===
  {
    label: '설정',
    path: '/settings',
    icon: <Settings className='h-4 w-4' />,
    section: '시스템',
  },
];

function groupMenusBySection(items: MenuItem[]): Map<string, MenuItem[]> {
  const groups = new Map<string, MenuItem[]>();
  for (const section of SECTION_ORDER) {
    const sectionItems = items.filter((item) => item.section === section);
    if (sectionItems.length > 0) {
      groups.set(section, sectionItems);
    }
  }
  return groups;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { userRole } = useBranch();

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const visibleMenus = menuItems.filter((menu) => {
    if (menu.hidden) return false;
    if (menu.adminOnly && !isOwnerOrAdmin) return false;
    return true;
  });

  const activePath = useMemo(() => {
    if (!pathname) return null;

    const exactMatch = visibleMenus.find((m) => m.path === pathname);
    if (exactMatch) return exactMatch.path;

    const prefixMatches = visibleMenus
      .filter((m) => pathname.startsWith(m.path + '/'))
      .sort((a, b) => b.path.length - a.path.length);

    return prefixMatches[0]?.path ?? null;
  }, [pathname, visibleMenus]);

  const sectionGroups = useMemo(
    () => groupMenusBySection(visibleMenus),
    [visibleMenus],
  );

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className='border-border/50 border-b px-4 py-3'>
        <Link
          href='/dashboard'
          onClick={handleNavClick}
          className='flex items-center gap-2'
        >
          <Receipt className='text-primary h-5 w-5' />
          <span className='text-sm font-semibold tracking-tight'>
            F&B Invoice
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {Array.from(sectionGroups.entries()).map(
          ([section, items], groupIndex) => (
            <SidebarGroup key={section}>
              {groupIndex > 0 && <SidebarSeparator className='mb-1' />}
              <SidebarGroupLabel className='tracking-wider uppercase'>
                {section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((menu) => {
                    const isActive = menu.path === activePath;
                    return (
                      <SidebarMenuItem key={menu.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={menu.label}
                          className={cn(
                            isActive &&
                              'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                          )}
                        >
                          <Link
                            href={menu.path}
                            onClick={handleNavClick}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {menu.icon}
                            <span>{menu.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ),
        )}
      </SidebarContent>

      <SidebarFooter className='p-4'>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type='button'
              className='bg-card text-card-foreground border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
            >
              <LogOut className='h-4 w-4' />
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
                <AlertDialogAction
                  type='submit'
                  className='bg-red-500 hover:bg-red-600'
                >
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
