import { NextRequest, NextResponse } from 'next/server';
import { upsertSalarySetting } from '@/utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const success = await upsertSalarySetting(body);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save salary setting' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
