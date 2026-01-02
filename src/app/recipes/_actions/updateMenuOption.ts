'use server';

import { createServiceRoleClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

type MenuOptionInput = {
  option_name: string;
  option_category: 'edge' | 'topping' | 'beverage';
  additional_price: number;
  image_url?: string;
  is_active: boolean;
};

export async function updateMenuOption(
  optionId: number,
  data: MenuOptionInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('menu_options')
      .update({
        option_name: data.option_name,
        option_category: data.option_category,
        additional_price: data.additional_price,
        image_url: data.image_url || null,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('option_id', optionId);

    if (error) {
      console.error('updateMenuOption error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('updateMenuOption catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function createMenuOption(
  data: MenuOptionInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from('menu_options').insert({
      option_name: data.option_name,
      option_category: data.option_category,
      additional_price: data.additional_price,
      image_url: data.image_url || null,
      is_active: data.is_active,
    });

    if (error) {
      console.error('createMenuOption error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('createMenuOption catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteMenuOption(
  optionId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from('menu_options')
      .delete()
      .eq('option_id', optionId);

    if (error) {
      console.error('deleteMenuOption error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/recipes');
    return { success: true };
  } catch (error) {
    console.error('deleteMenuOption catch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
