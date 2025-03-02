import { supabase } from '../supabase';
import { validateFile } from './validation';

/**
 * Uploads a novel cover image to Supabase storage and returns the public URL
 * @param file The image file to upload
 * @returns Promise resolving to the public URL of the uploaded image
 */
export async function uploadNovelCover(file: File): Promise<string> {
  try {
    // Validate file before upload
    await validateFile(file);

    // Create unique filename with timestamp instead of UUID
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `novel_cover_${timestamp}.${fileExt}`;

    // Upload file to novel_covers bucket
    const { error: uploadError } = await supabase.storage
      .from('novel_coverpage')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL of uploaded file
    const { data: urlData } = supabase.storage
      .from('novel_coverpage')
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading novel cover:', error);
    throw new Error(`Failed to upload cover image: ${error.message}`);
  }
}

/**
 * Deletes a novel cover image from Supabase storage
 * @param fileName Name of the file to delete
 */
export async function deleteNovelCover(fileName: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('novel_coverpage')
      .remove([fileName]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting novel cover:', error);
    throw new Error(`Failed to delete cover image: ${error.message}`);
  }
}