import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AuthModal } from '@/components/auth/AuthModal';
import FeatureDemo from './(landing)/FeatureDemo';
import FeatureCarousel from './(landing)/FeatureCarousel';

const features = [
  {
    title: '재고 현황',
    description: '실시간 재고 파악, 저재고 알림, 품목별 상태 관리',
    icon: '📦',
  },
  {
    title: '마감 체크',
    description: '매일 사용량/폐기량 입력, 자동 재고 차감',
    icon: '✅',
  },
  {
    title: '입출고 관리',
    description: '입고, 출고, 폐기, 조정 이력 추적',
    icon: '🔄',
  },
  {
    title: '리포트',
    description: '재고 추이, 사용량 분석, 발주 추천',
    icon: '📈',
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/inventory');
  }

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Main Content */}
      <div className='flex-1 bg-[#FA891A]'>
        {/* Hero Section */}
        <header className='container mx-auto px-6 py-16 text-center'>
          <h1 className='text-white mb-8 font-bold'>
            <span className='text-[8rem] leading-none'>푸</span>
            <span className='text-[4rem] leading-none mx-8'>&</span>
            <span className='text-[9rem] leading-none'>B</span>
          </h1>
          <p className='text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto'>
            재고를 쉽고 정확하게 관리하세요.
            <br />
            매일 마감 체크만 하면, 나머지는 앱이 관리합니다
          </p>
          <div className='flex gap-4 justify-center'>
            <AuthModal mode='sign-in'>
              <button className='w-32 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition shadow-lg cursor-pointer'>
                로그인
              </button>
            </AuthModal>
            <AuthModal mode='sign-up'>
              <button className='w-32 py-3 bg-transparent text-white rounded-lg font-medium border-2 border-white/50 hover:bg-white/10 transition shadow-lg cursor-pointer'>
                회원가입
              </button>
            </AuthModal>
          </div>
        </header>

        {/* Features Section */}
        <section className='container mx-auto px-6 py-16'>
          <FeatureCarousel />
          <h2 className='text-2xl md:text-3xl font-bold text-white text-center mb-12'>
            주요 기능
          </h2>
          <FeatureDemo features={features} />
        </section>

        {/* Feature Showcase Carousel */}
      </div>

      {/* Footer */}
      <footer className='bg-slate-100 text-slate-600'>
        <div className='container mx-auto px-6 py-12'>
          {/* Logo & Company Info */}
          <div className='flex flex-col lg:flex-row lg:justify-between gap-8 mb-8'>
            <div className='space-y-3'>
              <h3 className='text-xl font-bold text-slate-900'>푸&B</h3>
              <div className='text-sm space-y-1 text-slate-500'>
                <p>대표: 관희 | 사업자등록번호: 123-45-67890</p>
                <p>주소: 원피스 신세계 하늘섬, 777층</p>
                <p>고객센터: 1588-0000 (평일 09:00 - 18:00)</p>
                <p>이메일: support@fnb-management.com</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className='flex flex-wrap gap-x-6 gap-y-2 text-sm mb-6 pb-6 border-b border-slate-200'>
            <a href='#' className='hover:text-orange-500 transition'>
              회사소개
            </a>
            <a href='#' className='hover:text-orange-500 transition'>
              이용약관
            </a>
            <a
              href='#'
              className='font-semibold text-slate-900 hover:text-orange-500 transition'
            >
              개인정보처리방침
            </a>
            <a href='#' className='hover:text-orange-500 transition'>
              고객센터
            </a>
            <a href='#' className='hover:text-orange-500 transition'>
              제휴문의
            </a>
          </div>

          {/* Disclaimer */}
          <p className='text-xs text-slate-400 mb-6 leading-relaxed'>
            푸&B는 F&B 매장 관리 플랫폼으로서, 재고 관리, 마감 체크, 입출고 추적
            등의 서비스를 제공합니다. 본 서비스의 모든 콘텐츠에 대한 무단 복제,
            배포, 전송 등의 행위는 저작권법에 의해 보호됩니다.
          </p>

          {/* Copyright */}
          <p className='text-xs text-slate-400'>
            © 2025 F&B Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
