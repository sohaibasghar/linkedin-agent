import { api } from '@/lib/api-client';
import type { PostsResponse, GeneratedDraft } from './types';

// ─── Query fetchers ──────────────────────────────────────────────────────────

export interface FetchPostsParams {
  status?: string;
  isScheduled?: boolean;
  limit?: number;
  offset?: number;
}

export function fetchPosts(params: FetchPostsParams = {}) {
  return api.get<PostsResponse>('/api/posts', {
    params: {
      status:      params.status,
      isScheduled: params.isScheduled,
      limit:       params.limit,
      offset:      params.offset,
    },
  });
}

// ─── Mutation fetchers ───────────────────────────────────────────────────────

export function approvePost(postId: string, action: 'approve' | 'reject') {
  return api.post('/api/approve', { postId, action });
}

export function patchPost(postId: string, updates: Record<string, unknown>) {
  return api.patch(`/api/posts/${postId}`, updates);
}

export function publishPost(postId: string) {
  return api.post('/api/post', { postId });
}

export function generatePost(params: { subject?: string; withImage?: boolean }) {
  return api.post<GeneratedDraft>('/api/generate', params);
}
