import { getSalesHistory, getUserContext } from '@/utils/supabase/supabase';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { SalesContent } from './_components/SalesContent';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 사용자 컨텍스트 가져오기
  const context = await getUserContext(user.id);

  if (!context?.currentBranch?.id) {
    redirect('/onboarding');
  }

  const branchId = context.currentBranch.id;

  // 판매 내역 가져오기
  const [salesData] = await Promise.all([
    getSalesHistory(branchId),
    minDelay(),
  ]);

  return (
    <div className="p-4 md:p-6">
      <SalesContent initialSalesData={salesData} />
    </div>
  );
}
