import { useQuery } from 'react-query';
import { fetchNovels } from '../lib/supabase';
import { handleError } from '../lib/utils';

export function useNovels(options: {
  page?: number;
  limit?: number;
  genre?: string;
  orderBy?: string;
}) {
  return useQuery(
    ['novels', options],
    () => fetchNovels(options),
    {
      onError: handleError,
      keepPreviousData: true
    }
  );
}