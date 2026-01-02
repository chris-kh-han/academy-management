import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserContext } from '@/utils/supabase/supabase';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = await getUserContext(userId);

    return NextResponse.json(context);
  } catch (error) {
    console.error('GET /api/user/context error:', error);
    return NextResponse.json(
      { error: 'Failed to get user context' },
      { status: 500 },
    );
  }
}
