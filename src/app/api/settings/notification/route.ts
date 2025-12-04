import { NextResponse } from 'next/server';
import { updateNotificationSettings } from '@/utils/supabase/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const success = await updateNotificationSettings(body);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
