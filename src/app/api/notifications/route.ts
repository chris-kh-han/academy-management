import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUnreadNotifications } from '@/utils/supabase/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchId = request.nextUrl.searchParams.get('branchId');
    if (!branchId) {
      return NextResponse.json(
        { error: 'branchId is required' },
        { status: 400 },
      );
    }

    const notifications = await getUnreadNotifications(user.id, branchId);

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 },
    );
  }
}
