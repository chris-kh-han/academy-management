'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowRight,
  Loader2,
  Check,
  Package,
  ChefHat,
  BarChart3,
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import { useBranch } from '@/contexts/BranchContext';

type Step = 'welcome' | 'brand' | 'confirm' | 'complete';

const walkthroughSlides = [
  {
    title: '재고 관리를\n한눈에',
    description:
      '실시간 재고 현황 파악부터\n입출고 관리까지 한 번에 해결하세요.',
    icon: Package,
    color: 'text-blue-400',
  },
  {
    title: '메뉴와 레시피\n통합 관리',
    description: '메뉴별 레시피를 등록하고\n원가 계산까지 자동으로 처리됩니다.',
    icon: ChefHat,
    color: 'text-amber-400',
  },
  {
    title: '매출 분석\n리포트',
    description: '일별, 주별, 월별 매출 현황을\n직관적인 차트로 확인하세요.',
    icon: BarChart3,
    color: 'text-emerald-400',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentBrand, isInitialized, refreshContext, user } = useBranch();

  const [step, setStep] = useState<Step>('welcome');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandName, setBrandName] = useState('');

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  // Sync currentSlide with embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // 브랜드가 있으면 재고 현황으로 리다이렉트
  useEffect(() => {
    if (isInitialized && currentBrand) {
      router.push('/inventory');
    }
  }, [isInitialized, currentBrand, router]);

  // 뒤로가기 방지 (온보딩 중에는 이탈 불가)
  useEffect(() => {
    if (!isInitialized || currentBrand) return;

    // 현재 페이지를 히스토리에 추가
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // 뒤로가기 시 다시 현재 페이지로
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInitialized, currentBrand]);

  const handleNextSlide = () => {
    if (emblaApi && currentSlide < walkthroughSlides.length - 1) {
      emblaApi.scrollNext();
    } else {
      setStep('brand');
    }
  };

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  const handleSkip = () => {
    setStep('brand');
  };

  const handleNextFromBrand = () => {
    if (!brandName.trim()) {
      toast.error('브랜드 이름을 입력해주세요');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/setup/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('설정이 완료되었습니다');
      setStep('complete');

      // 서버 컴포넌트 갱신 후 부드럽게 이동
      setTimeout(async () => {
        await refreshContext();
        router.refresh();
        router.push('/inventory');
      }, 1500);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중이거나 초기화 전이면 로딩 표시
  if (!isInitialized) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // 이미 브랜드가 있으면 리다이렉트 중이므로 로딩 표시
  if (currentBrand) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Step: Welcome Walkthrough */}
      {step === 'welcome' && (
        <LiquidGlassCard
          blurIntensity='xl'
          className='w-[400px] h-[620px] p-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300'
        >
          {/* 건너뛰기 버튼 */}
          <div className='flex justify-end p-4'>
            <button
              onClick={handleSkip}
              className='text-white/60 hover:text-white text-sm cursor-pointer'
            >
              건너뛰기
            </button>
          </div>

          {/* Embla Carousel */}
          <div className='overflow-hidden' ref={emblaRef}>
            <div className='flex'>
              {walkthroughSlides.map((slide, index) => {
                const IconComponent = slide.icon;
                return (
                  <div key={index} className='flex-[0_0_100%] min-w-0 px-8'>
                    {/* 텍스트 영역 */}
                    <div className='mb-8'>
                      <h2 className='text-3xl font-bold text-white whitespace-pre-line leading-tight'>
                        {slide.title}
                      </h2>
                      <p className='text-white/70 mt-4 whitespace-pre-line'>
                        {slide.description}
                      </p>
                    </div>

                    {/* 아이콘 영역 */}
                    <div className='flex justify-center py-12'>
                      <div className='relative'>
                        {/* 배경 원 */}
                        <div className='w-40 h-40 rounded-full bg-white/10 flex items-center justify-center'>
                          <IconComponent
                            className={`w-20 h-20 ${slide.color}`}
                          />
                        </div>
                        {/* 장식 요소들 */}
                        <div className='absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full' />
                        <div className='absolute -bottom-4 -left-4 w-6 h-6 bg-white/10 rounded-full' />
                        <div className='absolute top-1/2 -right-8 w-3 h-3 bg-white/15 rounded-full' />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 컨트롤 영역 */}
          <div className='px-8 pb-8'>
            {/* 도트 인디케이터 */}
            <div className='flex justify-center gap-2 mb-8'>
              {walkthroughSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    index === currentSlide
                      ? 'bg-white w-6'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            {/* 다음/시작 버튼 */}
            <Button
              className='w-full bg-white text-gray-900 hover:bg-white/90 cursor-pointer py-6 text-lg'
              onClick={handleNextSlide}
            >
              {currentSlide === walkthroughSlides.length - 1
                ? '시작하기'
                : '다음'}
              <ArrowRight className='h-5 w-5 ml-2' />
            </Button>
          </div>

          {/* 하단 바 */}
          <div className='flex justify-center pb-4'>
            <div className='w-32 h-1 bg-white/20 rounded-full' />
          </div>
        </LiquidGlassCard>
      )}

      {/* Step: 브랜드 입력 */}
      {step === 'brand' && (
        <LiquidGlassCard
          blurIntensity='xl'
          className='w-[400px] h-[620px] p-0 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300'
        >
          {/* 돌아가기 버튼 */}
          <div className='flex justify-start p-4'>
            <button
              onClick={() => setStep('welcome')}
              className='text-white/60 hover:text-white text-sm cursor-pointer'
            >
              돌아가기
            </button>
          </div>

          <div className='px-8 pb-8 flex-1 flex flex-col'>
            <div className='mb-8 text-center'>
              <h2 className='text-2xl font-bold text-white'>브랜드 설정</h2>
              <p className='text-white/80 mt-2'>
                {user?.email?.split('@')[0]}님, 브랜드 이름을 입력해주세요
              </p>
            </div>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='brandName' className='text-white/80 text-xs'>
                  브랜드 이름
                </Label>
                <Input
                  id='brandName'
                  placeholder='예: 맛있는 피자'
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  disabled={isSubmitting}
                  className='bg-white/10 border-white/20 text-white placeholder:text-white/40'
                />
              </div>
              <div className='pt-4'>
                <Button
                  className='w-full bg-white text-gray-900 hover:bg-white/90 cursor-pointer'
                  onClick={handleNextFromBrand}
                  disabled={!brandName.trim()}
                >
                  다음
                  <ArrowRight className='h-4 w-4 ml-2' />
                </Button>
              </div>
            </div>
          </div>
          <div className='flex justify-center pb-4'>
            <div className='w-32 h-1 bg-white/20 rounded-full' />
          </div>
        </LiquidGlassCard>
      )}

      {/* Step: 확인 */}
      {step === 'confirm' && (
        <LiquidGlassCard
          blurIntensity='xl'
          className='w-[400px] h-[620px] p-8 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300'
        >
          <div className='mb-6'>
            <h2 className='flex items-center gap-2 text-xl font-bold text-white'>
              <Check className='h-5 w-5' />
              최종 확인
            </h2>
            <p className='text-white/80 mt-1'>입력하신 정보를 확인해주세요</p>
          </div>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <span className='text-white/80 text-xs'>브랜드 이름</span>
              <div className='p-4 rounded-lg bg-white/10 mt-1'>
                <span className='text-white font-medium'>{brandName}</span>
              </div>
            </div>
            <div className='flex gap-2 pt-4'>
              <Button
                variant='outline'
                onClick={() => setStep('brand')}
                disabled={isSubmitting}
                className='flex-1 bg-transparent border-white/30 text-white hover:bg-white/10 cursor-pointer'
              >
                이전
              </Button>
              <Button
                className='flex-1 bg-white text-gray-900 hover:bg-white/90 cursor-pointer'
                onClick={handleConfirmCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    생성 중...
                  </>
                ) : (
                  <>
                    확인
                    <Check className='h-4 w-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </div>
        </LiquidGlassCard>
      )}

      {/* Step: 완료 */}
      {step === 'complete' && (
        <LiquidGlassCard
          blurIntensity='xl'
          className='w-[400px] h-[620px] p-8 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300'
        >
          <div className='flex-1 flex flex-col items-center justify-center py-8'>
            <div className='w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4'>
              <Check className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-white mb-2'>설정 완료!</h2>
            <p className='text-white/80'>잠시 후 재고 현황으로 이동합니다...</p>
            <Loader2 className='h-5 w-5 animate-spin mt-4 text-white/80' />
          </div>
        </LiquidGlassCard>
      )}

      {/* 진행 표시 - 카드 밖 하단 */}
      {step !== 'welcome' && (
        <div className='flex justify-center'>
          <div className='flex items-center gap-3 text-sm text-white/50'>
            <span
              className={
                step === 'brand' || step === 'confirm'
                  ? 'text-white font-medium'
                  : ''
              }
            >
              브랜드 설정
            </span>
            <ArrowRight className='h-4 w-4' />
            <span
              className={step === 'complete' ? 'text-white font-medium' : ''}
            >
              완료
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
