import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { approvePost, patchPost, publishPost, generatePost } from './api';
import { postKeys } from './keys';
import type { PostsResponse, GeneratedDraft } from './types';

// ─── Shared helpers ──────────────────────────────────────────────────────────

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' });
}

/**
 * Optimistic removal: immediately hides a post from all DRAFT queries
 * and rolls back on error. Used by approve, schedule, publish mutations.
 */
function useOptimisticDraftRemoval() {
  const qc = useQueryClient();

  async function remove(postId: string) {
    await qc.cancelQueries({ queryKey: ['posts', 'DRAFT'] });
    const previous = qc.getQueriesData<PostsResponse>({ queryKey: ['posts', 'DRAFT'] });
    qc.setQueriesData<PostsResponse>({ queryKey: ['posts', 'DRAFT'] }, (old) => {
      if (!old) return old;
      return { posts: old.posts.filter((p) => p.postId !== postId), total: Math.max(0, old.total - 1) };
    });
    return { previous };
  }

  function rollback(context: { previous: [unknown, PostsResponse | undefined][] } | undefined) {
    context?.previous.forEach(([key, data]) => qc.setQueryData(key as string[], data));
  }

  return { remove, rollback };
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

/** Approve (→ publish) or reject a DRAFT post. */
export function useApprovePost(options?: { onSuccess?: (action: 'approve' | 'reject') => void }) {
  const invalidate = useInvalidateAll();
  const { remove, rollback } = useOptimisticDraftRemoval();

  return useMutation({
    mutationFn: ({ postId, action }: { postId: string; action: 'approve' | 'reject' }) =>
      approvePost(postId, action),
    onMutate: ({ postId }) => remove(postId),
    onError: (err: Error, _, ctx) => {
      rollback(ctx);
      toast.error(err.message);
    },
    onSuccess: async (_, { action }) => {
      toast.success(action === 'approve' ? 'Posted to LinkedIn!' : 'Post rejected.');
      await invalidate();
      options?.onSuccess?.(action);
    },
  });
}

/** Edit topic/content of a DRAFT post. */
export function useEditPost(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAll();

  return useMutation({
    mutationFn: ({ postId, topic, content }: { postId: string; topic: string; content: string }) =>
      patchPost(postId, { topic, content }),
    onSuccess: async () => {
      toast.success('Draft saved.');
      await invalidate();
      options?.onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Schedule a DRAFT post for a future date. */
export function useSchedulePost(options?: { onSuccess?: (scheduledFor: string) => void }) {
  const invalidate = useInvalidateAll();
  const { remove, rollback } = useOptimisticDraftRemoval();

  return useMutation({
    mutationFn: ({ postId, scheduledFor }: { postId: string; scheduledFor: string }) =>
      patchPost(postId, { scheduledFor, isScheduled: true }),
    onMutate: ({ postId }) => remove(postId),
    onError: (err: Error, _, ctx) => {
      rollback(ctx);
      toast.error(err.message);
    },
    onSuccess: async (_, { scheduledFor }) => {
      toast.success(`Scheduled for ${new Date(scheduledFor).toLocaleDateString()}.`);
      await invalidate();
      options?.onSuccess?.(scheduledFor);
    },
  });
}

/** Unschedule a post, moving it back to drafts. */
export function useUnschedulePost() {
  const invalidate = useInvalidateAll();

  return useMutation({
    mutationFn: (postId: string) => patchPost(postId, { isScheduled: false }),
    onSuccess: () => {
      toast.success('Moved back to drafts for editing.');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Move a REJECTED or FAILED post back to DRAFT. */
export function useMoveToDraft() {
  const invalidate = useInvalidateAll();

  return useMutation({
    mutationFn: (postId: string) => patchPost(postId, { status: 'DRAFT' }),
    onSuccess: () => {
      toast.success('Post moved back to drafts.');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Publish a post directly via /api/post (used by GeneratedPreview). */
export function usePublishPost(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAll();

  return useMutation({
    mutationFn: (postId: string) => publishPost(postId),
    onSuccess: async () => {
      toast.success('Posted to LinkedIn!');
      await invalidate();
      options?.onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Save draft edits without toast (for composition with other actions). */
export function useSavePost() {
  return useMutation({
    mutationFn: ({ postId, topic, content }: { postId: string; topic: string; content: string }) =>
      patchPost(postId, { topic, content }),
  });
}

/** Generate a new AI post. */
export function useGeneratePost(options?: { onSuccess?: (draft: GeneratedDraft) => void }) {
  return useMutation({
    mutationFn: (params: { subject?: string; withImage?: boolean }) => generatePost(params),
    onSuccess: (data) => options?.onSuccess?.(data),
  });
}
