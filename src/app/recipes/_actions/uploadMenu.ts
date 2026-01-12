'use server';

import { revalidatePath } from 'next/cache';
import { bulkCreateMenus } from '@/utils/supabase/supabase';

export async function uploadMenusAction(
  menus: {
    menu_name: string;
    price: number;
    category_id?: string;
    category?: string;
    branch_id: string;
  }[],
) {
  const result = await bulkCreateMenus(menus);

  if (result.success && result.inserted > 0) {
    revalidatePath('/recipes');
  }

  return result;
}
