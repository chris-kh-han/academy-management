import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { setDefaultBranch } from '@/utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { branchId } = await request.json();

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 }
      );
    }

    const success = await setDefaultBranch(user.id, branchId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to switch branch' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/user/switch-branch error:', error);
    return NextResponse.json(
      { error: 'Failed to switch branch' },
      { status: 500 }
    );
  }
}
