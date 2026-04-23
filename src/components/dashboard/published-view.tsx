'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePublishedPosts } from '@/hooks/posts';
import { StatusBadge, LoadingState, EmptyState, Pagination } from './shared';

const PAGE_SIZE = 10;

export function PublishedView() {
  const [page, setPage] = useState(0);
  const router = useRouter();
  const { data, isLoading } = usePublishedPosts();

  const allPosts = (data?.posts ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
  const pagePosts = allPosts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) return <LoadingState />;
  if (allPosts.length === 0) return <EmptyState message="No published posts yet." />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-[#bfc7d1] bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.05)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#efeeeb] text-left">
              {['Topic', 'Status', 'Scheduled', 'Published'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-xs text-[#707881] tracking-wider uppercase border-b border-[#bfc7d1]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagePosts.map((post) => (
              <tr
                key={post.postId}
                className="border-b border-[#efeeeb] last:border-0 hover:bg-[#faf9f6] transition-colors cursor-pointer"
                onClick={() => router.push(`/posts/${post.postId}`)}
              >
                <td className="px-4 py-3 max-w-[200px]">
                  {post.linkedInPostId ? (
                    <a
                      href={`https://www.linkedin.com/feed/update/${post.linkedInPostId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#005d8f] hover:underline truncate block font-medium"
                      title={post.topic}
                    >
                      {post.topic}
                    </a>
                  ) : (
                    <span className="truncate block font-medium" title={post.topic}>{post.topic}</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={post.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#707881]">{post.scheduledFor ?? '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[#707881]">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
