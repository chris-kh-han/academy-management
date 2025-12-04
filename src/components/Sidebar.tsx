'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[];
};

const menuItems: MenuItem[] = [
  { label: '대시보드', path: '/dashboard' },
  { label: '재고 관리', path: '/inventory' },
  { label: '입고/출고 관리', path: '/movements' },
  { label: '메뉴/레서피', path: '/recipes' },
  { label: '리포트', path: '/reports' },
  // { label: '근태 관리', path: '/attendance' },
  // { label: '급여 관리', path: '/payroll' },
  { label: '설정', path: '/settings' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        {menuItems.map((menu) => {
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
                'px-4 py-3 rounded-lg border',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground hover:bg-primary hover:text-primary-foreground',
                'border-border',
              )}
            >
              {menu.label}
            </Link>
          );
        })}
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter />
    </Sidebar>
  );
}
