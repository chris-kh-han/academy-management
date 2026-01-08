'use client';

import { useEffect, useState } from 'react';

export function PageLoading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const interval = 30;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(prev + increment, 100);
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-8'>
      <div className='w-64 space-y-8'>
        <div className='h-1 bg-[#FA891A]/30 rounded-full overflow-hidden'>
          <div
            className='h-full bg-white rounded-full transition-all duration-100 ease-out'
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className='text-center text-white/80  text-sm'>로딩 중...</p>
      </div>
    </div>
  );
}
