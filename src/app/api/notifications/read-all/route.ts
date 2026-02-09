import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { markAllNotificationsRead } from '@/utils/supabase/supabase';

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
    const { branchId } = body;

    if (!branchId || typeof branchId !== 'string') {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 },
      );
    }

    await markAllNotificationsRead(user.id, branchId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications/read-all error:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 },
    );
  }
}
