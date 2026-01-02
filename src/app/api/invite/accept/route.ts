import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '초대 코드를 입력해주세요' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 초대 코드 조회
    const { data: invite, error: inviteError } = await supabase
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
    const { data: existingMember } = await supabase
      .from('branch_members')
      .select('id')
      .eq('branch_id', invite.branch_id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 해당 지점의 멤버입니다' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const userName = user?.fullName || user?.firstName || '';

    // branch_members에 추가
    const { error: memberError } = await supabase.from('branch_members').insert({
      branch_id: invite.branch_id,
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
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
    await supabase
      .from('branch_invites')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
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
