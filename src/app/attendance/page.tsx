import { getUserPermissions, getWorkRecords } from '@/utils/supabase/supabase';
import AttendanceContent from './_components/AttendanceContent';
import { minDelay } from '@/lib/delay';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  // 이번 달 기준
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const [users, workRecords] = await Promise.all([
    getUserPermissions(),
    getWorkRecords(startDate, endDate),
    minDelay(),
  ]);

  return (
    <AttendanceContent
      users={users}
      initialWorkRecords={workRecords}
      initialDateRange={{ startDate, endDate }}
    />
  );
}
