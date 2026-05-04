'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DRAFT_PAGE_SIZE, useDrafts, useApprovePost, useEditPost, useSchedulePost } from '@/hooks/posts';
import { useCurrentUser } from '@/hooks/use-current-user';
import { IconEdit, IconSchedule } from './icons';
import { PostCard, LoadingState, EmptyState, Pagination } from './shared';
import { tomorrowLocal } from './helpers';

export function DraftsView({ excludeIds }: { excludeIds: Set<string> }) {
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(tomorrowLocal());
  const { data: currentUser } = useCurrentUser();

  const { data, isLoading } = useDrafts(page);

  const approveMutation = useApprovePost();
  const editMutation = useEditPost({ onSuccess: () => setEditingId(null) });
  const scheduleMutation = useSchedulePost({ onSuccess: () => setSchedulingId(null) });

  const visiblePosts = (data?.posts ?? []).filter((p) => !excludeIds.has(p.postId));
  const total = Math.max(0, (data?.total ?? 0) - excludeIds.size);
  const totalPages = Math.ceil(total / DRAFT_PAGE_SIZE);

  const editCharCount = editContent.length;
  const editOverLimit = editCharCount > 3000;

  if (isLoading) return <LoadingState />;
  if (visiblePosts.length === 0) return <EmptyState message="No draft posts." hint="Generate a post to get started." />;

  return (
    <div className="space-y-6">
      {visiblePosts.map((post) => {
        const isEditing = editingId === post.postId;
        const isScheduling = schedulingId === post.postId;

        if (isEditing) {
          return (
            <div key={post.postId} className="bg-white border border-[#bfc7d1] p-6 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.05)] space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-[#707881] font-semibold">Topic</Label>
                <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} className="font-medium" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-[#707881] font-semibold">Content</Label>
                  <span className={cn('text-xs', editOverLimit ? 'text-red-600 font-medium' : 'text-[#707881]')}>
                    {editCharCount}/3000
                  </span>
                </div>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className={cn('resize-y text-sm leading-relaxed', editOverLimit && 'border-red-500 focus-visible:ring-red-500')}
                />
                {editOverLimit && <p className="text-xs text-red-600">Exceeds LinkedIn&apos;s 3000 character limit</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-[#0077b5] text-white hover:opacity-90"
                  onClick={() => editMutation.mutate({ postId: post.postId, topic: editTopic, content: editContent })}
                  disabled={editMutation.isPending || editOverLimit}
                >
                  {editMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={editMutation.isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          );
        }

        return (
          <PostCard key={post.postId} topic={post.topic} content={post.content} status="DRAFT" createdAt={post.createdAt} imageUrl={post.imageUrl} href={`/posts/${post.postId}`}>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingId(post.postId); setEditTopic(post.topic); setEditContent(post.content); setSchedulingId(null); }}
                  className="text-[#707881] hover:text-[#005d8f] transition-colors p-1"
                  disabled={approveMutation.isPending || scheduleMutation.isPending}
                >
                  <IconEdit />
                </button>
                {!isScheduling ? (
                  <button
                    onClick={() => { setSchedulingId(post.postId); setScheduleDate(tomorrowLocal()); setEditingId(null); }}
                    className="text-[#707881] hover:text-[#005d8f] transition-colors p-1"
                    disabled={approveMutation.isPending}
                  >
                    <IconSchedule />
                  </button>
                ) : null}
              </div>

              {isScheduling && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Input type="date" value={scheduleDate} min={tomorrowLocal()} onChange={(e) => setScheduleDate(e.target.value)} className="w-36 h-8 text-sm" />
                  <Button
                    size="sm"
                    className="bg-violet-600 text-white hover:bg-violet-700"
                    onClick={() => {
                      const publishTime = currentUser?.publishTime ?? '08:00';
                      const [h, m] = publishTime.split(':').map(Number);
                      const dt = new Date(`${scheduleDate}T00:00:00Z`);
                      dt.setUTCHours(h!, m!, 0, 0);
                      scheduleMutation.mutate({ postId: post.postId, scheduledFor: dt.toISOString() });
                    }}
                    disabled={scheduleMutation.isPending}
                  >
                    {scheduleMutation.isPending ? 'Saving...' : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSchedulingId(null)} className="text-[#707881]">
                    Cancel
                  </Button>
                </div>
              )}

              {!isScheduling && (
                <div className="flex gap-3">
                  <button
                    className="text-sm font-semibold px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => approveMutation.mutate({ postId: post.postId, action: 'reject' })}
                    disabled={approveMutation.isPending}
                  >
                    Reject
                  </button>
                  <button
                    className="text-sm font-semibold px-6 py-2 bg-[#0077b5] text-white rounded-lg shadow-sm hover:opacity-90 transition-all"
                    onClick={() => approveMutation.mutate({ postId: post.postId, action: 'approve' })}
                    disabled={approveMutation.isPending || scheduleMutation.isPending}
                  >
                    {approveMutation.isPending && approveMutation.variables?.postId === post.postId && approveMutation.variables?.action === 'approve'
                      ? 'Posting...'
                      : 'Post Now'}
                  </button>
                </div>
              )}
            </div>
          </PostCard>
        );
      })}
      <Pagination page={page} totalPages={totalPages} isLoading={isLoading} onPageChange={setPage} />
    </div>
  );
}
