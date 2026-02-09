import { createServiceRoleClient, createClient } from '@/utils/supabase/server';
import { InvoiceTable } from './components/InvoiceTable';
import { minDelay } from '@/lib/delay';
import type { Invoice, Supplier } from '@/types';

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

async function getInvoices(branchId: string): Promise<Invoice[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*, supplier:suppliers(*)')
    .eq('branch_id', branchId)
    .order('received_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch invoices:', error);
    return [];
  }
  return data ?? [];
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

export default async function InvoicesPage() {
  const branchId = await getCurrentBranchId();
  const [invoices, suppliers] = await Promise.all([
    branchId ? getInvoices(branchId) : Promise.resolve([]),
    branchId ? getActiveSuppliers(branchId) : Promise.resolve([]),
    minDelay(),
  ]);

  return (
    <div className='animate-slide-in-left px-4 py-6 sm:px-8 sm:py-8 md:px-12'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold'>거래명세서</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            수신된 거래명세서를 검수하고 관리합니다.
          </p>
        </div>
        <InvoiceTable data={invoices} suppliers={suppliers} />
      </div>
    </div>
  );
}
