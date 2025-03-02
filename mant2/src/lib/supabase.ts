import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hhrwzfyutuhvengndjyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhocnd6Znl1dHVodmVuZ25kanluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTM3MjIsImV4cCI6MjA0NzY2OTcyMn0.JI2IwtLwrWWnRKrAuumNoFhCWPZgxiWNfMgvFlKuKe0';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Retry wrapper for Supabase queries
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 404 || error?.status === 503)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Optimized novel fetching with retry logic and error handling
export async function fetchNovels(options: {
  page?: number;
  limit?: number;
  genre?: string;
  orderBy?: string;
}) {
  const {
    page = 1,
    limit = 10,
    genre = 'All',
    orderBy = 'views'
  } = options;

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  return withRetry(async () => {
    let query = supabase
      .from('Novels')
      .select('*', { count: 'exact' })
      .order(orderBy, { ascending: false })
      .range(start, end);

    if (genre !== 'All') {
      query = query.contains('genre', [genre]);
    }

    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching novels:', error);
      throw error;
    }
    
    return {
      novels: data,
      total: count || 0,
      hasMore: (count || 0) > (page * limit)
    };
  });
}

// Upload functions with retry logic
export async function uploadNovelCover(file: File): Promise<string> {
  return withRetry(async () => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `novel_cover_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('novel_coverpage')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('novel_coverpage')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading novel cover:', error);
      throw error;
    }
  });
}

export async function uploadProfilePicture(file: File): Promise<string> {
  return withRetry(async () => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  });
}

// Auth state check
export async function checkAuthState() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error checking auth state:', error);
    return null;
  }
}

// Clear auth state
export async function clearAuthState() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase.auth.token');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
}