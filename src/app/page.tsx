import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AuthModal } from '@/components/auth/AuthModal';
import FeatureDemo from './(landing)/FeatureDemo';
import FeatureCarousel from './(landing)/FeatureCarousel';

const features = [
  {
    title: '재고 관리',
    description: '실시간 재고 현황 파악, 입출고 관리, 재고 부족 알림',
    icon: '📦',
  },
  {
    title: '메뉴 / 레시피',
    description: '메뉴별 레시피 관리, 원가 자동 계산, 레시피 표준화',
    icon: '🍳',
  },
  {
    title: '판매 분석',
    description: '일별/월별 매출 현황, 인기 메뉴 분석, 트렌드 파악',
    icon: '📊',
  },
  {
    title: '리포트',
    description: '재고 회전율, 손익 분석, 맞춤형 보고서 생성',
    icon: '📈',
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Main Content */}
      <div className='flex-1 bg-[#FA891A]'>
        {/* Hero Section */}
        <header className='container mx-auto px-6 py-16 text-center'>
          <h1 className='text-white mb-8 font-(family-name:--font-do-hyeon)'>
            <span className='text-[10rem] leading-none'>푸</span>
            <span className='text-[6rem] leading-none mx-8'>&</span>
            <span className='text-[12rem] leading-none'>B</span>
          </h1>
          <p className='text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto'>
            재고, 레시피, 판매를 한 곳에서 관리하세요.
            <br />
            효율적인 매장 운영을 위한 올인원 솔루션
          </p>
          <div className='flex gap-4 justify-center'>
            <AuthModal mode='sign-in'>
              <button className='w-32 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition shadow-lg'>
                로그인
              </button>
            </AuthModal>
            <AuthModal mode='sign-up'>
              <button className='w-32 py-3 bg-transparent text-white rounded-lg font-medium border-2 border-white/50 hover:bg-white/10 transition'>
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
      <footer className='bg-slate-50 text-slate-600'>
        <div className='container mx-auto px-6 py-12'>
          {/* Logo & Company Info */}
          <div className='flex flex-col lg:flex-row lg:justify-between gap-8 mb-8'>
            <div className='space-y-3'>
              <h3 className='text-xl font-bold text-slate-900'>푸&B</h3>
              <div className='text-sm space-y-1 text-slate-500'>
                <p>대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
                <p>주소: 서울특별시 강남구 테헤란로 123, 4층</p>
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
            푸&B는 F&B 매장 관리 플랫폼으로서, 재고 관리, 레시피 관리, 판매 분석
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
