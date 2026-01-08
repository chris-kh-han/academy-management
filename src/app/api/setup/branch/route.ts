import { NextResponse } from 'next/server';

/**
 * B2C 모드에서는 지점 생성 기능 비활성화
 * B2B 확장 시 아래 주석 해제하여 복원
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This feature is not available in B2C mode' },
    { status: 403 }
  );
}

/*
// B2B 모드용 코드 (확장 시 복원)
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

    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: '지점 이름과 slug가 필요합니다' },
        { status: 400 }
      );
    }

    // Service role client 사용 (RLS 우회)
    const serviceClient = createServiceRoleClient();

    // 사용자가 소유한 브랜드 찾기
    const { data: brands, error: brandError } = await serviceClient
      .from('brands')
      .select('id, name')
      .eq('owner_user_id', user.id)
      .limit(1);

    if (brandError) throw brandError;

    if (!brands || brands.length === 0) {
      return NextResponse.json(
        { error: '먼저 브랜드를 생성해주세요' },
        { status: 400 }
      );
    }

    const brand = brands[0];

    // 지점 생성
    const { data: branch, error: branchError } = await serviceClient
      .from('branches')
      .insert({
        brand_id: brand.id,
        name,
        slug,
        manager_user_id: user.id, // 생성자가 기본 매니저
      })
      .select()
      .single();

    if (branchError) {
      if (branchError.code === '23505') {
        return NextResponse.json(
          { error: '이 브랜드에 이미 동일한 slug의 지점이 있습니다' },
          { status: 400 }
        );
      }
      throw branchError;
    }

    // 생성자를 branch_members에도 추가 (manager, is_default = true)
    const { error: memberError } = await serviceClient.from('branch_members').insert({
      branch_id: branch.id,
      user_id: user.id,
      role: 'manager',
      is_default: true,
    });

    if (memberError) {
      console.error('Branch member 추가 실패:', memberError);
    }

    return NextResponse.json({ branch, brand });
  } catch (error) {
    console.error('지점 생성 오류:', error);
    return NextResponse.json(
      { error: '지점 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
*/
