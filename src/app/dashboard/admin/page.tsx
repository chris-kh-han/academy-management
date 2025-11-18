'use client';

import { useUser, UserButton } from '@clerk/nextjs';

const AdminPage = () => {
  const { user } = useUser();

  return (
    <div className='p-4 flex gap-4 flex-col'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
        <div className='flex items-center gap-4'>
          <span>Welcome, {user?.username || user?.firstName}!</span>
          <UserButton />
        </div>
      </div>
      <div>Admin Content</div>
    </div>
  );
};

export default AdminPage;
