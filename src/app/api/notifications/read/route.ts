import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { markNotificationRead } from '@/utils/supabase/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId || typeof notificationId !== 'string') {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 },
      );
    }

    await markNotificationRead(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications/read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 },
    );
  }
}
