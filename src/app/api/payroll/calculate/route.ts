import { NextRequest, NextResponse } from 'next/server';
import { calculateAndCreatePayroll } from '@/utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, periodStart, periodEnd } = body;

    if (!userId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'userId, periodStart, and periodEnd are required' },
        { status: 400 },
      );
    }

    const payroll = await calculateAndCreatePayroll(userId, periodStart, periodEnd);

    if (payroll) {
      return NextResponse.json(payroll);
    } else {
      return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
