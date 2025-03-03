import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hhrwzfyutuhvengndjyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhocnd6Znl1dHVodmVuZ25kanluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwOTM3MjIsImV4cCI6MjA0NzY2OTcyMn0.JI2IwtLwrWWnRKrAuumNoFhCWPZgxiWNfMgvFlKuKe0';

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient>;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce',
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      db: {
        schema: 'public'
      },
      realtime: {
        timeout: 60000  // Increased to 60 seconds
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

// Increased timeouts and retries
const MAX_RETRIES = 3;  // Reduced number of retries
const RETRY_DELAY = 5000;  // Increased initial delay to 5 seconds
const AUTH_TIMEOUT = 30000;  // Increased to 30 seconds

// Enhanced retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
  operationName = 'Operation'
): Promise<T> {
  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out`));
      }, AUTH_TIMEOUT);
    });

    return await Promise.race([
      operation(),
      timeoutPromise
    ]);
  } catch (error: any) {
    if (retries > 0) {
      console.log(`Retrying ${operationName}, attempts remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 1.5, operationName);
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

// Auth state check with retry
export async function checkAuthState() {
  return withRetry(
    async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
      } catch (error) {
        console.error('Error checking auth state:', error);
        return null;
      }
    },
    MAX_RETRIES,
    RETRY_DELAY,
    'Auth state check'
  );
}

// Clear auth state with retry
export async function clearAuthState() {
  return withRetry(
    async () => {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
      } catch (error) {
        console.error('Error clearing auth state:', error);
      }
    },
    MAX_RETRIES,
    RETRY_DELAY,
    'Clear auth state'
  );
}