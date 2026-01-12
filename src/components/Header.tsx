'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  const { userRole, currentBrand } = useBranch();
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
          {currentBrand?.logo_url ? (
            <img
              src={currentBrand.logo_url}
              alt='logo'
              className='h-8 max-w-[120px] object-contain'
            />
          ) : (
            <span className='text-lg font-semibold'>
              {currentBrand?.name || 'My Business'}
            </span>
          )}
        </Link>
        {/* 지점 선택기 */}
        <div className='hidden sm:block border-l pl-4'>
          <BranchSwitcher />
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className='flex items-center gap-2'>
        {/* 모바일 햄버거 메뉴 */}
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
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className='flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600'
                    >
                      <LogOut className='h-4 w-4' />
                      로그아웃
                    </DropdownMenuItem>
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
