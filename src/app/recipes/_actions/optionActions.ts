'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

type CreateOptionWithLinkInput = {
  option_name: string;
  option_category: string;
  additional_price: number;
  image_url?: string;
  branch_id: string;
  link_type: 'category' | 'menu';
  category_id?: string;
  menu_id?: string;
};

export async function createOptionWithLink(
  input: CreateOptionWithLinkInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    // 1. 옵션 생성
    const { data: option, error: optionError } = await supabase
      .from('menu_options')
      .insert({
        option_name: input.option_name,
        option_category: input.option_category,
        additional_price: input.additional_price,
        image_url: input.image_url || null,
        is_active: true,
        branch_id: input.branch_id,
      })
      .select('id')
      .single();

    if (optionError) {
      console.error('createOptionWithLink option error:', optionError);
      return { success: false, error: optionError.message };
    }

    // 2. 옵션 연결 생성
    const linkData: {
      option_id: string;
      branch_id: string;
      menu_id?: string;
      category_id?: string;
    } = {
      option_id: option.id,
      branch_id: input.branch_id,
    };

    if (input.link_type === 'menu' && input.menu_id) {
      linkData.menu_id = input.menu_id;
    } else if (input.link_type === 'category' && input.category_id) {
      linkData.category_id = input.category_id;
    }

    const { error: linkError } = await supabase
      .from('menu_option_links')
      .insert(linkData);

    if (linkError) {
      console.error('createOptionWithLink link error:', linkError);
      // 옵션은 생성됐으나 링크 실패 - 옵션 삭제
      await supabase.from('menu_options').delete().eq('id', option.id);
      return { success: false, error: linkError.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('createOptionWithLink catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 옵션에 추가 연결 생성 (기존 옵션을 다른 메뉴/카테고리에도 연결)
export async function addOptionLink(
  optionId: string,
  linkType: 'category' | 'menu',
  targetId: string,
  branchId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    const linkData: {
      option_id: string;
      branch_id: string;
      menu_id?: string;
      category_id?: string;
    } = {
      option_id: optionId,
      branch_id: branchId,
    };

    if (linkType === 'menu') {
      linkData.menu_id = targetId;
    } else {
      linkData.category_id = targetId;
    }

    const { error } = await supabase
      .from('menu_option_links')
      .insert(linkData);

    if (error) {
      console.error('addOptionLink error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('addOptionLink catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 옵션 연결 삭제
export async function removeOptionLink(
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('menu_option_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('removeOptionLink error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('removeOptionLink catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 카테고리 또는 메뉴에 연결된 옵션 조회
export async function getOptionsForTarget(
  targetType: 'category' | 'menu',
  targetId: string
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    option_id: string;
    option_name: string;
    option_category: string;
    additional_price: number;
    image_url?: string;
    is_active: boolean;
    link_id: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    let query = supabase
      .from('menu_option_links')
      .select(`
        id,
        option_id,
        menu_options (
          id,
          option_name,
          option_category,
          additional_price,
          image_url,
          is_active
        )
      `);

    if (targetType === 'menu') {
      query = query.eq('menu_id', targetId);
    } else {
      query = query.eq('category_id', targetId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getOptionsForTarget error:', error);
      return { success: false, error: error.message };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = (data || []).map((link: any) => {
      const opt = link.menu_options;
      return {
        id: opt?.id,
        option_id: link.option_id,
        option_name: opt?.option_name,
        option_category: opt?.option_category,
        additional_price: opt?.additional_price,
        image_url: opt?.image_url,
        is_active: opt?.is_active,
        link_id: link.id,
      };
    }).filter((opt: { id: string }) => opt.id);

    return { success: true, data: options };
  } catch (error) {
    console.error('getOptionsForTarget catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
