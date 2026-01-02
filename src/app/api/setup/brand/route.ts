import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // 환경변수 디버그
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('ENV CHECK - URL:', hasUrl, 'SERVICE_KEY:', hasKey);

    if (!hasUrl || !hasKey) {
      return NextResponse.json(
        { error: `환경변수 누락 - URL: ${hasUrl}, SERVICE_KEY: ${hasKey}` },
        { status: 500 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: '브랜드 이름과 slug가 필요합니다' },
        { status: 400 }
      );
    }

    // Service role client 사용 (RLS 우회)
    const supabase = createServiceRoleClient();

    // 브랜드 생성
    console.log('Creating brand:', { name, slug, owner_user_id: userId });

    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        name,
        slug,
        owner_user_id: userId,
      })
      .select()
      .single();

    console.log('Brand result:', { brand, brandError });

    if (brandError) {
      console.error('Brand creation error:', brandError);
      if (brandError.code === '23505') {
        return NextResponse.json(
          { error: '이미 사용 중인 slug입니다' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `브랜드 생성 실패: ${brandError.message}` },
        { status: 500 }
      );
    }

    // Owner를 brand_members에도 추가 (is_default = true)
    const { error: memberError } = await supabase.from('brand_members').insert({
      brand_id: brand.id,
      user_id: userId,
      role: 'owner',
      is_default: true,
    });

    if (memberError) {
      // 브랜드는 생성되었지만 멤버 추가 실패 - 로그만 남기고 계속
      console.error('Brand member 추가 실패:', memberError);
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('브랜드 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `브랜드 생성에 실패했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
