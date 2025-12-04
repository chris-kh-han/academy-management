import Link from 'next/link';

type MenuItem = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[]; // 접근 가능한 역할
};

const menuType: MenuItem[] = [
  { label: '대시보드', path: '/dashboard' },
  { label: '재고 관리', path: '/inventory' },
  { label: '입고/출고 관리', path: '/stock' },
  { label: '메뉴/레서피', path: '/recipes' },
  { label: '근태 관리', path: '/attendance' },
  { label: '급여 관리', path: '/payroll' },
  { label: '리포트', path: '/reports' },
  { label: '설정', path: '/settings' },
];

export default function Menu() {
  return (
    <div className='flex flex-col gap-4 p-4 mt-4'>
      {menuType.map((menu) => (
        <Link
          key={menu.path}
          href={menu.path}
          className='
            px-4 py-3 rounded-lg
            bg-card text-card-foreground
            hover:bg-primary hover:text-primary-foreground
            border border-border
          '
        >
          {menu.label}
        </Link>
      ))}
    </div>
  );
}
