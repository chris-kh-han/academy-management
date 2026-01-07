'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const showcaseScreens = [
  {
    category: '재고 관리',
    title: '실시간 재고 현황',
    content: (
      <div className='bg-white rounded-xl p-4 shadow-lg'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-slate-700'>재고 현황</span>
          <span className='text-xs text-slate-500'>오늘 기준</span>
        </div>
        <div className='grid grid-cols-3 gap-2'>
          {[
            { name: '밀가루', qty: '25kg', status: 'good' },
            { name: '설탕', qty: '8kg', status: 'warning' },
            { name: '버터', qty: '2kg', status: 'danger' },
          ].map((item) => (
            <div key={item.name} className='bg-slate-50 rounded-lg p-3'>
              <p className='text-xs text-slate-500'>{item.name}</p>
              <p className='text-lg font-semibold'>{item.qty}</p>
              <div className={`h-1 rounded mt-2 ${
                item.status === 'good' ? 'bg-emerald-400' :
                item.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    category: '메뉴 / 레시피',
    title: '원가 자동 계산',
    content: (
      <div className='bg-white rounded-xl p-4 shadow-lg'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-slate-700'>아메리카노</span>
          <span className='px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full'>판매중</span>
        </div>
        <div className='space-y-2 mb-3'>
          {[
            { name: '에스프레소 30ml', cost: '500원' },
            { name: '정수물 150ml', cost: '50원' },
            { name: '얼음 100g', cost: '100원' },
          ].map((ing) => (
            <div key={ing.name} className='flex items-center justify-between text-xs bg-slate-50 p-2 rounded'>
              <span className='text-slate-600'>{ing.name}</span>
              <span className='text-slate-700'>{ing.cost}</span>
            </div>
          ))}
        </div>
        <div className='grid grid-cols-3 gap-2'>
          <div className='bg-slate-50 rounded-lg p-2 text-center'>
            <p className='text-[10px] text-slate-500'>원가</p>
            <p className='text-sm font-bold text-slate-700'>650원</p>
          </div>
          <div className='bg-slate-50 rounded-lg p-2 text-center'>
            <p className='text-[10px] text-slate-500'>판매가</p>
            <p className='text-sm font-bold'>4,500원</p>
          </div>
          <div className='bg-emerald-50 rounded-lg p-2 text-center'>
            <p className='text-[10px] text-emerald-600'>마진율</p>
            <p className='text-sm font-bold text-emerald-600'>85.6%</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    category: '판매 분석',
    title: '인기 메뉴 TOP 5',
    content: (
      <div className='bg-white rounded-xl p-4 shadow-lg'>
        <span className='text-sm font-medium text-slate-700'>인기 메뉴 TOP 5</span>
        <div className='mt-3 space-y-2'>
          {[
            { rank: 1, name: '아메리카노', sales: 145, pct: 100 },
            { rank: 2, name: '카페라떼', sales: 98, pct: 68 },
            { rank: 3, name: '바닐라라떼', sales: 76, pct: 52 },
            { rank: 4, name: '카푸치노', sales: 54, pct: 37 },
            { rank: 5, name: '모카', sales: 42, pct: 29 },
          ].map((menu) => (
            <div key={menu.rank} className='flex items-center gap-2'>
              <span className='w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold'>
                {menu.rank}
              </span>
              <span className='flex-1 text-xs'>{menu.name}</span>
              <div className='w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden'>
                <div className='h-full bg-orange-400' style={{ width: `${menu.pct}%` }} />
              </div>
              <span className='text-[10px] text-slate-500 w-8 text-right'>{menu.sales}건</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    category: '재고 관리',
    title: '재고 부족 알림',
    content: (
      <div className='bg-white rounded-xl p-4 shadow-lg'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-slate-700'>재고 알림</span>
          <span className='text-xs text-red-500'>3개 부족</span>
        </div>
        <div className='space-y-2'>
          {[
            { name: '버터', current: '2kg', min: '5kg', urgent: true },
            { name: '설탕', current: '8kg', min: '10kg', urgent: false },
            { name: '우유', current: '2L', min: '5L', urgent: true },
          ].map((item) => (
            <div key={item.name} className={`bg-slate-50 rounded-lg p-2 border-l-2 ${item.urgent ? 'border-red-400' : 'border-amber-400'}`}>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-xs'>{item.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.urgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  {item.urgent ? '긴급' : '주의'}
                </span>
              </div>
              <div className='flex justify-between text-[10px] mt-1 text-slate-500'>
                <span>현재: {item.current}</span>
                <span>최소: {item.min}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    category: '판매 분석',
    title: '오늘의 매출',
    content: (
      <div className='bg-white rounded-xl p-4 shadow-lg'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-slate-700'>오늘의 매출</span>
          <span className='text-xs text-emerald-600'>+12.5%</span>
        </div>
        <div className='bg-orange-50 rounded-lg p-3 text-center mb-3'>
          <p className='text-2xl font-bold text-orange-600'>1,234,500원</p>
          <p className='text-[10px] text-slate-500 mt-1'>주문 87건 | 객단가 14,190원</p>
        </div>
        <div className='h-16 bg-slate-50 rounded-lg flex items-end p-2 gap-1'>
          {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
            <div key={i} className='flex-1 bg-orange-400 rounded-t' style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    category: '리포트',
    title: '손익 계산서',
    content: (
      <div className='bg-white rounded-xl p-4 shadow-lg'>
        <div className='flex items-center justify-between mb-3'>
          <span className='text-sm font-medium text-slate-700'>손익 계산서</span>
          <span className='text-xs text-slate-500'>2025년 1월</span>
        </div>
        <div className='space-y-1'>
          {[
            { label: '매출', value: '32,450,000', type: 'revenue' },
            { label: '매출원가', value: '-10,546,250', type: 'cost' },
            { label: '매출총이익', value: '21,903,750', type: 'profit' },
            { label: '판관비', value: '-12,168,750', type: 'cost' },
            { label: '영업이익', value: '9,735,000', type: 'net' },
          ].map((row) => (
            <div key={row.label} className={`flex justify-between p-2 rounded text-xs ${row.type === 'net' ? 'bg-orange-50' : 'bg-slate-50'}`}>
              <span className={row.type === 'net' ? 'font-bold' : ''}>{row.label}</span>
              <span className={row.type === 'cost' ? 'text-red-600' : row.type === 'net' ? 'text-orange-600 font-bold' : ''}>
                {row.value}원
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 자동 슬라이드 (2초 간격)
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseScreens.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + showcaseScreens.length) % showcaseScreens.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % showcaseScreens.length);
  };

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  return (
    <section className='py-16 overflow-hidden'>
      <div className='container mx-auto px-6'>
        <h2 className='text-2xl md:text-3xl font-bold text-white text-center mb-4'>
          미리 보는 기능
        </h2>
        <p className='text-white/70 text-center mb-12 max-w-xl mx-auto'>
          실제 사용 화면을 미리 확인해보세요
        </p>

        {/* Carousel Container */}
        <div className='relative'>
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className='absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300'
          >
            <ChevronLeft className='w-5 h-5 text-slate-700' />
          </button>
          <button
            onClick={handleNext}
            className='absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300'
          >
            <ChevronRight className='w-5 h-5 text-slate-700' />
          </button>

          {/* 3D Sliding Cards Container */}
          <div
            className='relative h-[420px] md:h-[380px] flex justify-center items-start'
            style={{ perspective: '1200px' }}
          >
            {showcaseScreens.map((screen, idx) => {
              // 현재 인덱스와의 거리 계산 (순환 고려)
              let distance = idx - currentIndex;
              if (distance > showcaseScreens.length / 2) distance -= showcaseScreens.length;
              if (distance < -showcaseScreens.length / 2) distance += showcaseScreens.length;

              const isActive = distance === 0;
              const isVisible = Math.abs(distance) <= 1; // 현재 + 좌우 1개씩 = 총 3개

              if (!isVisible) return null;

              // 3D 변환 계산
              const translateX = distance * 280;
              const translateZ = isActive ? 50 : -100 * Math.abs(distance);
              const rotateY = distance * -25; // 안쪽으로 기울임
              const scale = isActive ? 1.05 : 0.75 - Math.abs(distance) * 0.05;

              return (
                <div
                  key={idx}
                  className='absolute top-0'
                  style={{
                    transform: `
                      translateX(${translateX}px)
                      translateZ(${translateZ}px)
                      rotateY(${rotateY}deg)
                      scale(${scale})
                    `,
                    opacity: isActive ? 1 : Math.max(0.3, 0.7 - Math.abs(distance) * 0.2),
                    zIndex: 10 - Math.abs(distance),
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className='w-72 md:w-80'>
                    <div
                      className='mb-3 text-center'
                      style={{
                        opacity: isActive ? 1 : 0.4,
                        transform: isActive ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.9)',
                        transition: 'all 0.5s ease-out',
                      }}
                    >
                      <span className='inline-block text-xs text-white/80 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm'>
                        {screen.category}
                      </span>
                      <h3 className='text-white font-medium mt-2 text-lg'>{screen.title}</h3>
                    </div>
                    <div
                      className='rounded-xl overflow-hidden'
                      style={{
                        boxShadow: isActive
                          ? '0 25px 50px -12px rgba(251, 146, 60, 0.4), 0 0 30px rgba(251, 146, 60, 0.2)'
                          : '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
                        animation: isActive ? 'float 3s ease-in-out infinite' : 'none',
                        transition: 'box-shadow 0.5s ease-out',
                      }}
                    >
                      {screen.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className='flex justify-center gap-2 mt-6'>
            {showcaseScreens.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${currentIndex === i ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
