import Link from 'next/link';

type MenuItem = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[]; // 접근 가능한 역할
};

const menuType: MenuItem[] = [
  { label: '재고 현황', path: '/inventory' },
  { label: '마감 체크', path: '/closing' },
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
            px-4 py-3 rounded-lg cursor-pointer
            bg-card text-card-foreground
            hover:bg-orange-100/50 hover:text-orange-600
            border border-border
            transition-colors duration-200
          '
        >
          {menu.label}
        </Link>
      ))}
    </div>
  );
}
