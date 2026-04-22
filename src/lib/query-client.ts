import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';

/**
 * Shared QueryClient factory.
 *
 * Defaults:
 * - staleTime 0        → invalidation always triggers real refetch
 * - retry 1            → one retry on transient failures, skip on auth errors
 * - refetchOnWindowFocus → keeps data fresh when user returns
 * - gcTime 5 min       → garbage-collect unused cache entries
 */
export function createQueryClient(overrides?: QueryClientConfig['defaultOptions']): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime:0,
        retry: (failureCount, error) => {
          // Never retry auth errors
          if (error instanceof ApiError && error.isAuth) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: true,
        ...overrides?.queries,
      },
      mutations: {
        retry: false,
        ...overrides?.mutations,
      },
    },
  });
}
