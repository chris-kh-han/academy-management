import { createClient } from './client';

const BUCKET_NAME = 'menu-images';

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param folder - The folder path ('menus' or 'options')
 * @returns The public URL of the uploaded image, or null if failed
 */
export async function uploadMenuImage(
  file: File,
  folder: 'menus' | 'options' | 'logos'
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Generate unique filename with timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    return getPublicUrl(data.path);
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The full public URL of the image to delete
 * @returns true if successful, false otherwise
 */
export async function deleteMenuImage(imageUrl: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Extract path from URL
    const path = extractPathFromUrl(imageUrl);
    if (!path) return false;

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Get the public URL for a storage path
 * @param path - The storage path (e.g., 'menus/123456.jpg')
 * @returns The full public URL
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return publicUrl;
}

/**
 * Extract the storage path from a public URL
 * @param url - The full public URL
 * @returns The storage path, or null if invalid
 */
function extractPathFromUrl(url: string): string | null {
  try {
    // URL format: https://{project}.supabase.co/storage/v1/object/public/menu-images/{path}
    const match = url.match(/\/menu-images\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validate image file
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!validTypes.includes(file.type)) {
    return 'JPG, PNG, WEBP 파일만 업로드 가능합니다.';
  }

  if (file.size > maxSize) {
    return '파일 크기는 2MB 이하여야 합니다.';
  }

  return null;
}
