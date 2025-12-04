import { NextRequest, NextResponse } from 'next/server';
import { updatePayrollStatus } from '@/utils/supabase/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, paidAt } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const success = await updatePayrollStatus(id, status, paidAt);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
