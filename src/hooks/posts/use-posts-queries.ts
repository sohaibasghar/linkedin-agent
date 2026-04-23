import { useApiQuery } from '@/hooks/use-api-query';
import { fetchPost, fetchPosts } from './api';
import { postKeys } from './keys';
import type { Post, PostsResponse } from './types';

export function usePost(id: string) {
  return useApiQuery<Post>({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPost(id),
    enabled: !!id,
  });
}

export const DRAFT_PAGE_SIZE = 5;

export function useDrafts(page: number) {
  return useApiQuery<PostsResponse>({
    queryKey: postKeys.drafts(page),
    queryFn: () => fetchPosts({ status: 'DRAFT', isScheduled: false, limit: DRAFT_PAGE_SIZE, offset: page * DRAFT_PAGE_SIZE }),
  });
}

export function useScheduledPosts() {
  return useApiQuery<PostsResponse>({
    queryKey: postKeys.scheduled(),
    queryFn: () => fetchPosts({ status: 'DRAFT', isScheduled: true, limit: 100 }),
  });
}

export function usePublishedPosts() {
  return useApiQuery<PostsResponse>({
    queryKey: postKeys.published(),
    queryFn: () => fetchPosts({ status: 'PUBLISHED', limit: 200 }),
  });
}

export function useRejectedPosts() {
  return useApiQuery<PostsResponse>({
    queryKey: postKeys.rejected(),
    queryFn: () => fetchPosts({ status: 'REJECTED', limit: 200 }),
  });
}

export function useFailedPosts() {
  return useApiQuery<PostsResponse>({
    queryKey: postKeys.failed(),
    queryFn: () => fetchPosts({ status: 'FAILED', limit: 200 }),
  });
}
