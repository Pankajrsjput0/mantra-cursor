import { supabase } from '../supabase';
import { Chapter } from '../../types/database';
import { toast } from 'react-hot-toast';
import { withTimeout, SUPABASE_TIMEOUT } from '../utils';

interface CreateChapterData {
  title: string;
  content: string;
  chapter_number: number;
}

export async function createChapter(
  novelId: string,
  data: CreateChapterData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Chapters')
        .insert([{
          novel_id: novelId,
          ...data,
          views: 0,
          created_at: new Date().toISOString()
        }]),
      SUPABASE_TIMEOUT,
      'Creating chapter'
    );

    if (error) throw error;

    toast.success('Chapter created successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating chapter:', error);
    const message = error.message || 'Failed to create chapter';
    toast.error(message);
    return { success: false, error: message };
  }
}

export async function updateChapter(
  chapterId: string,
  data: Partial<CreateChapterData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Chapters')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('chapter_id', chapterId),
      SUPABASE_TIMEOUT,
      'Updating chapter'
    );

    if (error) throw error;

    toast.success('Chapter updated successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating chapter:', error);
    const message = error.message || 'Failed to update chapter';
    toast.error(message);
    return { success: false, error: message };
  }
}

export async function deleteChapter(
  chapterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Chapters')
        .delete()
        .eq('chapter_id', chapterId),
      SUPABASE_TIMEOUT,
      'Deleting chapter'
    );

    if (error) throw error;

    toast.success('Chapter deleted successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting chapter:', error);
    const message = error.message || 'Failed to delete chapter';
    toast.error(message);
    return { success: false, error: message };
  }
}