import { createServiceRoleClient, createClient } from '@/utils/supabase/server';
import { ScanPage } from './components/ScanPage';
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

async function getActiveSuppliers(branchId: string): Promise<Supplier[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Failed to fetch suppliers:', error);
    return [];
  }
  return data ?? [];
}

async function getIngredientsList(branchId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, ingredient_name, unit')
    .eq('branch_id', branchId)
    .order('ingredient_name');

  if (error) {
    console.error('Failed to fetch ingredients:', error);
    return [];
  }
  return data ?? [];
}

export default async function InvoiceScanPage() {
  const branchId = await getCurrentBranchId();
  const [suppliers, ingredients] = await Promise.all([
    branchId ? getActiveSuppliers(branchId) : Promise.resolve([]),
    branchId ? getIngredientsList(branchId) : Promise.resolve([]),
    minDelay(),
  ]);

  return (
    <div className='animate-slide-in-left px-4 py-6 sm:px-8 sm:py-8 md:px-12'>
      <ScanPage suppliers={suppliers} ingredients={ingredients} />
    </div>
  );
}
