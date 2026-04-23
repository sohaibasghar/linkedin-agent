import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export function useCurrentUser() {
  return useQuery<CurrentUser>({
    queryKey: ['me'],
    queryFn: () => api.get<CurrentUser>('/api/me'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
