import { notFound } from 'next/navigation';
import { createServiceRoleClient, createClient } from '@/utils/supabase/server';
import { InvoiceDetail } from './components/InvoiceDetail';
import { minDelay } from '@/lib/delay';
import type { Invoice } from '@/types';

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

async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(
      '*, supplier:suppliers(*), items:invoice_items(*, ingredient:ingredients(id, ingredient_name, unit))',
    )
    .eq('id', invoiceId)
    .single();

  if (error) {
    console.error('Failed to fetch invoice:', error);
    return null;
  }
  return data;
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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const branchId = await getCurrentBranchId();

  const [invoice, ingredients] = await Promise.all([
    getInvoiceById(id),
    branchId ? getIngredientsList(branchId) : Promise.resolve([]),
    minDelay(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className='animate-slide-in-left px-4 py-6 sm:px-8 sm:py-8 md:px-12'>
      <InvoiceDetail invoice={invoice} ingredients={ingredients} />
    </div>
  );
}
