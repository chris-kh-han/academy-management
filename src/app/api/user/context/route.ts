import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserContext } from '@/utils/supabase/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const context = await getUserContext(user.id);

    return NextResponse.json(context);
  } catch (error) {
    console.error('GET /api/user/context error:', error);
    return NextResponse.json(
      { error: 'Failed to get user context' },
      { status: 500 }
    );
  }
}
