import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import { withTimeout, SUPABASE_TIMEOUT } from '../utils';

export async function updateReadingProgress(
  userId: string,
  novelId: string,
  chapterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Reading_Progress')
        .upsert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          lastread_at: new Date().toISOString()
        }),
      SUPABASE_TIMEOUT,
      'Updating reading progress'
    );

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reading progress:', error);
    const message = error.message || 'Failed to update reading progress';
    toast.error(message);
    return { success: false, error: message };
  }
}