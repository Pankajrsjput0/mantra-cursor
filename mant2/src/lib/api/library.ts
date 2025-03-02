import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import { withTimeout, SUPABASE_TIMEOUT } from '../utils';

export async function addToLibrary(
  userId: string,
  novelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Library')
        .insert([{
          user_id: userId,
          novel_id: novelId,
          created_at: new Date().toISOString()
        }]),
      SUPABASE_TIMEOUT,
      'Adding to library'
    );

    if (error) throw error;

    toast.success('Added to library!');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding to library:', error);
    const message = error.message || 'Failed to add to library';
    toast.error(message);
    return { success: false, error: message };
  }
}

export async function removeFromLibrary(
  userId: string,
  novelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Library')
        .delete()
        .match({ user_id: userId, novel_id: novelId }),
      SUPABASE_TIMEOUT,
      'Removing from library'
    );

    if (error) throw error;

    toast.success('Removed from library!');
    return { success: true };
  } catch (error: any) {
    console.error('Error removing from library:', error);
    const message = error.message || 'Failed to remove from library';
    toast.error(message);
    return { success: false, error: message };
  }
}