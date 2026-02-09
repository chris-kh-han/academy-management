import { SupplierContent } from './components/SupplierContent';
import { createServiceRoleClient } from '@/utils/supabase/server';
import { createClient } from '@/utils/supabase/server';
import { minDelay } from '@/lib/delay';
import type { Supplier } from '@/types';

export const dynamic = 'force-dynamic';

async function getCurrentBranchId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('brand_members')
    .select('brand_id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single();

  if (!data?.brand_id) return null;

  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('brand_id', data.brand_id)
    .limit(1)
    .single();

  return branch?.id ?? null;
}

async function getSuppliers(branchId: string): Promise<Supplier[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('branch_id', branchId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch suppliers:', error);
    return [];
  }
  return data ?? [];
}

export default async function SuppliersPage() {
  const branchId = await getCurrentBranchId();
  const [suppliers] = await Promise.all([
    branchId ? getSuppliers(branchId) : Promise.resolve([]),
    minDelay(),
  ]);

  return (
    <div className='animate-slide-in-left px-4 py-6 sm:px-8 sm:py-8 md:px-12'>
      <SupplierContent suppliers={suppliers} />
    </div>
  );
}
