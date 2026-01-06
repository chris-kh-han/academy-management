import Image from 'next/image';
import { SearchIcon } from '../../icons';
import { createClient } from '@/utils/supabase/server';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className='flex items-center justify-between p-4'>
      <div className='flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2'>
        <SearchIcon />
        <input
          type='text'
          placeholder='Search...'
          className='w-[200px] p-2  outline-none'
        />
      </div>

      <div className='flex justify-end items-center w-full gap-6'>
        <Image src='/announcement.png' alt='' width={20} height={20} />
        <div>{user?.email?.split('@')[0] || 'User'}</div>
      </div>
    </div>
  );
}
