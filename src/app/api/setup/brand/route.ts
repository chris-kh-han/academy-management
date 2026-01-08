import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasKey) {
      return NextResponse.json(
        { error: `환경변수 누락 - URL: ${hasUrl}, SERVICE_KEY: ${hasKey}` },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: '브랜드 이름이 필요합니다' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();

    // 브랜드 생성
    const { data: brand, error: brandError } = await serviceClient
      .from('brands')
      .insert({
        name,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (brandError) {
      console.error('Brand creation error:', brandError);
      return NextResponse.json(
        { error: `브랜드 생성 실패: ${brandError.message}` },
        { status: 500 }
      );
    }

    // brand_members에 owner 추가
    const { error: brandMemberError } = await serviceClient
      .from('brand_members')
      .insert({
        brand_id: brand.id,
        user_id: user.id,
        role: 'owner',
        is_default: true,
      });

    if (brandMemberError) {
      console.error('Brand member creation error:', brandMemberError);
    }

    // 기본 지점 자동 생성 (B2C: 브랜드명 사용, B2B 확장시 변경 가능)
    const { data: branch, error: branchError } = await serviceClient
      .from('branches')
      .insert({
        name,
        brand_id: brand.id,
      })
      .select()
      .single();

    if (branchError) {
      console.error('Branch creation error:', branchError);
      return NextResponse.json(
        { error: `지점 생성 실패: ${branchError.message}` },
        { status: 500 }
      );
    }

    // branch_members는 나중에 설정에서 추가

    return NextResponse.json({ brand, branch });
  } catch (error) {
    console.error('브랜드 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `브랜드 생성에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
