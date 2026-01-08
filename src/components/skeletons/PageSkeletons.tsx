'use client';

import { useEffect, useState } from 'react';

export function PageLoading({ message = '로딩 중...' }: { message?: string }) {
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

  const chars = message.split('');
  const totalChars = chars.length;

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-8'>
      <div className='w-64 space-y-8'>
        <div className='h-1 bg-primary/20 rounded-full overflow-hidden'>
          <div
            className='h-full bg-primary rounded-full transition-all duration-100 ease-out'
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className='text-center text-sm font-medium' aria-label={message}>
          {chars.map((char, index) => {
            // 각 글자 내부에서도 채워지는 효과
            const charProgress = (progress / 100) * (totalChars + 1);
            const fillAmount = Math.min(100, Math.max(0, (charProgress - index) * 100));

            return (
              <span
                key={index}
                aria-hidden='true'
                className='inline-block bg-clip-text text-transparent'
                style={{
                  backgroundImage: `linear-gradient(to right, var(--primary) ${fillAmount}%, var(--muted-foreground) ${fillAmount}%)`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
