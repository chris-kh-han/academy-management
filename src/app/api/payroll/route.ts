import { NextRequest, NextResponse } from 'next/server';
import { getPayrolls } from '@/utils/supabase/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;

    const payrolls = await getPayrolls(year, month);
    return NextResponse.json(payrolls);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
