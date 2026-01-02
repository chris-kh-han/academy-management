import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { setDefaultBranch } from '@/utils/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { branchId } = await request.json();

    if (!branchId) {
      return NextResponse.json(
        { error: 'Branch ID is required' },
        { status: 400 },
      );
    }

    const success = await setDefaultBranch(userId, branchId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to switch branch' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/user/switch-branch error:', error);
    return NextResponse.json(
      { error: 'Failed to switch branch' },
      { status: 500 },
    );
  }
}
