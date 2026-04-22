import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api-client';

/**
 * Thin wrapper around useQuery that standardises the error type to ApiError.
 *
 * @example
 * const { data } = useApiQuery({
 *   queryKey: ['posts', 'DRAFT'],
 *   queryFn: () => fetchPosts({ status: 'DRAFT' }),
 * });
 */
export function useApiQuery<T>(options: UseQueryOptions<T, ApiError>) {
  return useQuery<T, ApiError>({...options,staleTime:0});
}
