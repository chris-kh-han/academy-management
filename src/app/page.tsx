import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

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
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-slate-100'>
      {/* Hero Section */}
      <header className='container mx-auto px-6 py-16 text-center'>
        <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-4'>
          F&B 매장 관리 시스템
        </h1>
        <p className='text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto'>
          재고, 레시피, 판매를 한 곳에서 관리하세요.
          <br />
          효율적인 매장 운영을 위한 올인원 솔루션
        </p>
        <div className='flex gap-4 justify-center'>
          <SignInButton mode='modal'>
            <button className='px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition'>
              로그인
            </button>
          </SignInButton>
          <SignUpButton mode='modal'>
            <button className='px-6 py-3 bg-white text-slate-900 rounded-lg font-medium border border-slate-300 hover:bg-slate-50 transition'>
              회원가입
            </button>
          </SignUpButton>
        </div>
      </header>

      {/* Features Section */}
      <section className='container mx-auto px-6 py-16'>
        <h2 className='text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12'>
          주요 기능
        </h2>
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {features.map((feature) => (
            <div
              key={feature.title}
              className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition'
            >
              <div className='text-4xl mb-4'>{feature.icon}</div>
              <h3 className='text-lg font-semibold text-slate-900 mb-2'>
                {feature.title}
              </h3>
              <p className='text-slate-600 text-sm'>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className='container mx-auto px-6 py-8 text-center text-slate-500 text-sm'>
        © 2025 F&B Management System
      </footer>
    </div>
  );
}
