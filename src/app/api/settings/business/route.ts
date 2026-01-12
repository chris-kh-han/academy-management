import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceRoleClient();

    // 사용자의 브랜드 정보 가져오기
    const { data: brandMember } = await serviceClient
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .single();

    if (!brandMember) {
      return NextResponse.json(null);
    }

    const { data: brand } = await serviceClient
      .from('brands')
      .select('*')
      .eq('id', brandMember.brand_id)
      .single();

    return NextResponse.json(brand);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { logo_url, address, phone, email, business_hours_start, business_hours_end } = body;

    const serviceClient = createServiceRoleClient();

    // 사용자의 브랜드 찾기
    const { data: brandMember } = await serviceClient
      .from('brand_members')
      .select('brand_id')
      .eq('user_id', user.id)
      .single();

    if (!brandMember) {
      return NextResponse.json({ error: 'No brand found' }, { status: 404 });
    }

    // 브랜드의 기본 지점 찾기
    const { data: branch } = await serviceClient
      .from('branches')
      .select('id')
      .eq('brand_id', brandMember.brand_id)
      .limit(1)
      .single();

    // 브랜드 업데이트 (logo_url)
    const { error: brandError } = await serviceClient
      .from('brands')
      .update({
        logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandMember.brand_id);

    if (brandError) {
      console.error('Brand update error:', brandError);
      return NextResponse.json({ error: 'Failed to save brand settings' }, { status: 500 });
    }

    // 지점 업데이트 (나머지 필드)
    if (branch) {
      const { error: branchError } = await serviceClient
        .from('branches')
        .update({
          address,
          phone,
          email,
          business_hours_start,
          business_hours_end,
          updated_at: new Date().toISOString(),
        })
        .eq('id', branch.id);

      if (branchError) {
        console.error('Branch update error:', branchError);
        return NextResponse.json({ error: 'Failed to save branch settings' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
