'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BranchSwitcher from '@/components/BranchSwitcher';
import { useBranch } from '@/contexts/BranchContext';
import { signOut } from '@/app/auth/actions';

type MenuItem = {
  label: string;
  path: string;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  { label: '대시보드', path: '/dashboard' },
  { label: '재고 관리', path: '/inventory' },
  { label: '입고/출고 관리', path: '/movements' },
  { label: '메뉴/레서피', path: '/recipes' },
  { label: '리포트', path: '/reports' },
  { label: '설정', path: '/settings' },
  { label: '초기 설정', path: '/setup', adminOnly: true },
];

export default function Header() {
  const pathname = usePathname();
  const { userRole, user } = useBranch();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // owner 또는 admin인지 확인
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  // 역할에 따라 메뉴 필터링
  const visibleMenus = menuItems.filter((menu) => {
    if (menu.adminOnly && !isOwnerOrAdmin) return false;
    return true;
  });

  return (
    <header className='h-16 border-b border-border bg-background flex items-center justify-between px-4 shrink-0'>
      <div className='flex items-center gap-4'>
        <Link href='/' className='flex items-center gap-2'>
          <Image src='/next.svg' alt='logo' width={100} height={24} />
        </Link>
        {/* 지점 선택기 */}
        <div className='hidden sm:block border-l pl-4'>
          <BranchSwitcher />
        </div>
      </div>

      {/* 모바일: 사용자 메뉴 + 드롭다운 메뉴 */}
      <div className='flex items-center gap-2'>
        {/* 사용자 드롭다운 */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='gap-2'>
                <span className='hidden sm:inline text-sm'>
                  {user?.email?.split('@')[0]}
                </span>
                <div className='w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium'>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut}>
                  <button type='submit' className='flex items-center gap-2 w-full'>
                    <LogOut className='h-4 w-4' />
                    로그아웃
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 모바일 메뉴 */}
        <div className='block md:hidden'>
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>메뉴 열기</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                {visibleMenus.map((menu) => {
                  const isActive =
                    pathname === menu.path ||
                    pathname?.startsWith(menu.path + '/');
                  return (
                    <DropdownMenuItem key={menu.path} asChild>
                      <Link
                        href={menu.path}
                        className={cn(
                          'w-full cursor-pointer',
                          isActive && 'bg-accent'
                        )}
                      >
                        {menu.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
