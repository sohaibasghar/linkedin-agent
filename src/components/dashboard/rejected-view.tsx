'use client';

import { useState } from 'react';
import { useRejectedPosts, useFailedPosts, useMoveToDraft } from '@/hooks/posts';
import { PostCard, LoadingState, EmptyState, Pagination } from './shared';

const PAGE_SIZE = 10;

export function RejectedView() {
  const [page, setPage] = useState(0);
  const { data: rejectedData, isLoading: l1 } = useRejectedPosts();
  const { data: failedData, isLoading: l2 } = useFailedPosts();
  const moveToDraftMutation = useMoveToDraft();

  const isLoading = l1 || l2;

  const allPosts = [
    ...(rejectedData?.posts ?? []),
    ...(failedData?.posts ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
  const pagePosts = allPosts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) return <LoadingState />;
  if (allPosts.length === 0) return <EmptyState message="No rejected or failed posts." />;

  return (
    <div className="space-y-6">
      {pagePosts.map((post) => (
        <PostCard
          key={post.postId}
          topic={post.topic}
          content={post.content}
          status={post.status}
          createdAt={post.createdAt}
          href={`/posts/${post.postId}`}
          borderClass={post.status === 'FAILED' ? 'border-red-200 bg-red-50/30' : undefined}
        >
          <div className="flex justify-between items-center w-full">
            <div>
              {post.errorMessage && (
                <p className="text-xs text-red-600">Error: {post.errorMessage}</p>
              )}
            </div>
            <button
              className="text-sm font-semibold px-4 py-2 text-[#005d8f] hover:bg-[#d9e4ea] rounded-lg transition-colors"
              onClick={() => moveToDraftMutation.mutate(post.postId)}
              disabled={moveToDraftMutation.isPending}
            >
              {moveToDraftMutation.isPending && moveToDraftMutation.variables === post.postId ? 'Moving...' : 'Move to Drafts'}
            </button>
          </div>
        </PostCard>
      ))}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
