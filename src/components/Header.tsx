'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { label: '대시보드', path: '/dashboard' },
  { label: '재고 관리', path: '/inventory' },
  { label: '입고/출고 관리', path: '/movements' },
  { label: '메뉴/레서피', path: '/recipes' },
  { label: '리포트', path: '/reports' },
  { label: '설정', path: '/settings' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className='h-16 border-b border-border bg-background flex items-center justify-between px-4 shrink-0'>
      <Link href='/' className='flex items-center gap-2'>
        <Image src='/next.svg' alt='logo' width={100} height={24} />
      </Link>

      {/* 모바일: UserButton + 드롭다운 메뉴 */}
      <div className='flex items-center gap-2'>
        <UserButton />
        <div className='block md:hidden'>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <Menu className='h-5 w-5' />
              <span className='sr-only'>메뉴 열기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            {menuItems.map((menu) => {
              const isActive =
                pathname === menu.path || pathname?.startsWith(menu.path + '/');
              return (
                <DropdownMenuItem key={menu.path} asChild>
                  <Link
                    href={menu.path}
                    className={cn(
                      'w-full cursor-pointer',
                      isActive && 'bg-accent',
                    )}
                  >
                    {menu.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
