import { getUserPermissions, getPayrolls, getSalarySettings } from '@/utils/supabase/supabase';
import PayrollContent from './_components/PayrollContent';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const [users, payrolls, salarySettings] = await Promise.all([
    getUserPermissions(),
    getPayrolls(year, month),
    getSalarySettings(),
    minDelay(),
  ]);

  return (
    <PayrollContent
      users={users}
      initialPayrolls={payrolls}
      salarySettings={salarySettings}
      initialYear={year}
      initialMonth={month}
    />
  );
}
