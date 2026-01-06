'use client';

import { useBranch } from '@/contexts/BranchContext';

const AdminPage = () => {
  const { user } = useBranch();

  return (
    <div className='p-4 flex gap-4 flex-col'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
        <div className='flex items-center gap-4'>
          <span>Welcome, {user?.email?.split('@')[0]}!</span>
        </div>
      </div>
      <div>Admin Content</div>
    </div>
  );
};

export default AdminPage;
