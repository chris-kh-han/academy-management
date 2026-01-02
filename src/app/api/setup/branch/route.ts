import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
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
    const supabase = createServiceRoleClient();

    // 사용자가 소유한 브랜드 찾기
    const { data: brands, error: brandError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('owner_user_id', userId)
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
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({
        brand_id: brand.id,
        name,
        slug,
        manager_user_id: userId, // 생성자가 기본 매니저
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
    const { error: memberError } = await supabase.from('branch_members').insert({
      branch_id: branch.id,
      user_id: userId,
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
