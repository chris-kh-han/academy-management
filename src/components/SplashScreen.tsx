'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 프로그레스 바 애니메이션
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // 1.5초 후 fade-out 시작
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1500);

    // 2초 후 완전히 숨김
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FA891A] transition-opacity duration-500 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ paddingBottom: '35%' }}
    >
      {/* 로고 텍스트 */}
      <h1 className='flex items-center mb-12 font-(family-name:--font-do-hyeon)' aria-label='푸&B'>
        {['푸', '&', 'B'].map((char, index) => {
          const charProgress = (progress / 100) * 4;
          const fillAmount = Math.min(100, Math.max(0, (charProgress - index) * 100));
          const sizes = ['text-[10rem]', 'text-[6rem] mx-8', 'text-[12rem]'];

          return (
            <span
              key={index}
              aria-hidden='true'
              className={`${sizes[index]} leading-none inline-block bg-clip-text text-transparent`}
              style={{
                backgroundImage: `linear-gradient(to right, white ${fillAmount}%, rgba(255,255,255,0.3) ${fillAmount}%)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </h1>

      {/* 프로그레스 바 컨테이너 */}
      <div className='w-64 space-y-8'>
        <div className='h-1 bg-white/30 rounded-full overflow-hidden'>
          <div
            className='h-full bg-white rounded-full transition-all duration-100 ease-out'
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 로딩 텍스트 */}
        <p className='text-center text-white/80 text-sm'>로딩 중...</p>
      </div>
    </div>
  );
}
