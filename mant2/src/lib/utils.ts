import { toast } from 'react-hot-toast';

export const SUPABASE_TIMEOUT = 30000; // 15 seconds

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = SUPABASE_TIMEOUT,
  operation: string = 'Operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(`${operation} timed out. Please try again.`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

export function handleError(error: any) {
  console.error('Error:', error);
  const message = error instanceof TimeoutError 
    ? error.message 
    : error?.message || 'An unexpected error occurred';
  toast.error(message);
}

export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    operation?: string;
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    delay = 1000, 
    operation = 'Operation'
  } = options;
  
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await withTimeout(fetchFn(), SUPABASE_TIMEOUT, operation);
    } catch (error) {
      lastError = error;
      if (error instanceof TimeoutError) {
        // Don't retry on timeout errors
        throw error;
      }
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}