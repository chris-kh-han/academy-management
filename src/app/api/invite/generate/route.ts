import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

// 6자리 랜덤 코드 생성
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외 (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { branchId, role = 'staff', email, expiresInDays = 7 } = await request.json();

    if (!branchId) {
      return NextResponse.json(
        { error: '지점 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 사용자가 해당 지점의 관리자인지 확인
    const { data: branch } = await supabase
      .from('branches')
      .select(`
        id, name, brand_id,
        brands(id, owner_user_id)
      `)
      .eq('id', branchId)
      .single();

    if (!branch) {
      return NextResponse.json(
        { error: '지점을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 권한 확인: 브랜드 오너이거나 지점 매니저여야 함
    const brandData = Array.isArray(branch.brands) ? branch.brands[0] : branch.brands;
    const isOwner = brandData?.owner_user_id === userId;

    const { data: brandMember } = await supabase
      .from('brand_members')
      .select('role')
      .eq('brand_id', branch.brand_id)
      .eq('user_id', userId)
      .single();

    const { data: branchMember } = await supabase
      .from('branch_members')
      .select('role')
      .eq('branch_id', branchId)
      .eq('user_id', userId)
      .single();

    const isBrandAdmin = brandMember?.role === 'owner' || brandMember?.role === 'admin';
    const isBranchManager = branchMember?.role === 'manager';

    if (!isOwner && !isBrandAdmin && !isBranchManager) {
      return NextResponse.json(
        { error: '초대 코드를 생성할 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 고유한 코드 생성 (충돌 시 재시도)
    let code: string | null = null;
    let attempts = 0;
    while (!code && attempts < 5) {
      const candidateCode = generateCode();
      const { data: existing } = await supabase
        .from('branch_invites')
        .select('id')
        .eq('code', candidateCode)
        .single();

      if (!existing) {
        code = candidateCode;
      }
      attempts++;
    }

    if (!code) {
      return NextResponse.json(
        { error: '초대 코드 생성에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 만료일 계산
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // 초대 생성
    const { data: invite, error: inviteError } = await supabase
      .from('branch_invites')
      .insert({
        branch_id: branchId,
        code,
        email: email || null,
        role,
        expires_at: expiresAt.toISOString(),
        created_by: userId,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('초대 생성 실패:', inviteError);
      return NextResponse.json(
        { error: '초대 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        code: invite.code,
        role: invite.role,
        expiresAt: invite.expires_at,
        branchName: branch.name,
      },
    });
  } catch (error) {
    console.error('초대 생성 오류:', error);
    return NextResponse.json(
      { error: '초대 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}

// 초대 목록 조회
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) {
      return NextResponse.json(
        { error: '지점 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 초대 목록 조회
    const { data: invites, error } = await supabase
      .from('branch_invites')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('초대 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '초대 목록 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}
