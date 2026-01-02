import { getSalesHistory, getUserContext } from '@/utils/supabase/supabase';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SalesContent } from './_components/SalesContent';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  // 사용자 인증 확인
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // 사용자 컨텍스트 가져오기
  const context = await getUserContext(userId);

  if (!context?.currentBranch?.id) {
    redirect('/onboarding');
  }

  const branchId = context.currentBranch.id;

  // 판매 내역 가져오기
  const salesData = await getSalesHistory(branchId);

  return (
    <div className="p-4 md:p-6">
      <SalesContent initialSalesData={salesData} />
    </div>
  );
}
