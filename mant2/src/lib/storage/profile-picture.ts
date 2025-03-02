import { supabase } from '../supabase';
import { validateFile } from './validation';

/**
 * Uploads a profile picture to Supabase storage and returns the public URL
 * @param file The image file to upload
 * @returns Promise resolving to the public URL of the uploaded image
 */
export async function uploadProfilePicture(file: File): Promise<string> {
  try {
    await validateFile(file);

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_${timestamp}.${fileExt}`;

    // Simple upload without metadata
    const { error: uploadError } = await supabase.storage
      .from('profile_pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    throw new Error(`Failed to upload profile picture: ${error.message}`);
  }
}

/**
 * Deletes a profile picture from Supabase storage
 * @param fileName Name of the file to delete
 */
export async function deleteProfilePicture(fileName: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('profile_pictures')
      .remove([fileName]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error deleting profile picture:', error);
    throw new Error(`Failed to delete profile picture: ${error.message}`);
  }
}