import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '초대 코드를 입력해주세요' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // 초대 코드 조회
    const { data: invite, error: inviteError } = await serviceClient
      .from('branch_invites')
      .select('*, branches(id, name, brand_id, brands(id, name))')
      .eq('code', code.toUpperCase())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 초대 코드입니다' },
        { status: 400 }
      );
    }

    // 이미 해당 지점의 멤버인지 확인
    const { data: existingMember } = await serviceClient
      .from('branch_members')
      .select('id')
      .eq('branch_id', invite.branch_id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 해당 지점의 멤버입니다' },
        { status: 400 }
      );
    }

    // branch_members에 추가
    const { error: memberError } = await serviceClient.from('branch_members').insert({
      branch_id: invite.branch_id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || '',
      role: invite.role,
      is_default: true,
    });

    if (memberError) {
      console.error('멤버 추가 실패:', memberError);
      return NextResponse.json(
        { error: '멤버 추가에 실패했습니다' },
        { status: 500 }
      );
    }

    // 초대 사용 처리
    await serviceClient
      .from('branch_invites')
      .update({
        used_at: new Date().toISOString(),
        used_by: user.id,
      })
      .eq('id', invite.id);

    return NextResponse.json({
      success: true,
      branch: invite.branches,
    });
  } catch (error) {
    console.error('초대 수락 오류:', error);
    return NextResponse.json(
      { error: '초대 수락에 실패했습니다' },
      { status: 500 }
    );
  }
}
