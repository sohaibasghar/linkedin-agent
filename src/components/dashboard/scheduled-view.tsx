'use client';

import { useScheduledPosts, useApprovePost, useUnschedulePost } from '@/hooks/posts';
import { IconSchedule } from './icons';
import { PostCard, LoadingState, EmptyState } from './shared';

export function ScheduledView({ excludeIds }: { excludeIds: Set<string> }) {
  const { data, isLoading } = useScheduledPosts();

  const cancelMutation = useApprovePost();
  const postNowMutation = useApprovePost();
  const unscheduleMutation = useUnschedulePost();

  const scheduledPosts = (data?.posts ?? []).filter((p) => !excludeIds.has(p.postId));

  if (isLoading) return <LoadingState />;
  if (scheduledPosts.length === 0) return <EmptyState message="No scheduled posts." hint='Use "Schedule" on a draft to queue it for a future date.' />;

  return (
    <div className="space-y-6">
      {scheduledPosts.map((post) => (
        <PostCard
          key={post.postId}
          topic={post.topic}
          content={post.content}
          status="DRAFT"
          createdAt={post.createdAt}
          href={`/posts/${post.postId}`}
          borderClass="border-blue-200 bg-blue-50/30"
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-[#707881]">
              <IconSchedule className="text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Publishes {new Date(post.scheduledFor).toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
              <button
                className="text-sm font-semibold px-4 py-2 text-[#707881] hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => unscheduleMutation.mutate(post.postId)}
                disabled={unscheduleMutation.isPending || postNowMutation.isPending}
              >
                {unscheduleMutation.isPending && unscheduleMutation.variables === post.postId ? 'Moving...' : 'Edit Draft'}
              </button>
              <button
                className="text-sm font-semibold px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => cancelMutation.mutate({ postId: post.postId, action: 'reject' })}
                disabled={cancelMutation.isPending || postNowMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="text-sm font-semibold px-6 py-2 bg-[#0077b5] text-white rounded-lg shadow-sm hover:opacity-90 transition-all"
                onClick={() => postNowMutation.mutate({ postId: post.postId, action: 'approve' })}
                disabled={postNowMutation.isPending || unscheduleMutation.isPending}
              >
                Post Now
              </button>
            </div>
          </div>
        </PostCard>
      ))}
    </div>
  );
}
