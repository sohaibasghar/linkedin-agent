'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  usePost,
  useApprovePost,
  useEditPost,
  useSchedulePost,
  useUnschedulePost,
  useMoveToDraft,
  usePublishPost,
} from '@/hooks/posts';
import {
  IconLinkedIn,
  Sidebar,
  MobileNav,
  ProfileMenu,
} from '@/components/dashboard';
import { StatusBadge } from '@/components/dashboard/shared';
import { tomorrowLocal } from '@/components/dashboard/helpers';
import type { SidebarView } from '@/components/dashboard/helpers';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: post, isLoading, isError } = usePost(id);

  const [isEditing, setIsEditing]       = useState(false);
  const [editTopic, setEditTopic]       = useState('');
  const [editContent, setEditContent]   = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(tomorrowLocal());

  const approveMutation     = useApprovePost({ onSuccess: () => router.back() });
  const editMutation        = useEditPost({ onSuccess: () => setIsEditing(false) });
  const scheduleMutation    = useSchedulePost({ onSuccess: () => { setShowSchedule(false); router.back(); } });
  const unscheduleMutation  = useUnschedulePost();
  const moveToDraftMutation = useMoveToDraft();
  const publishMutation     = usePublishPost({ onSuccess: () => router.back() });

  function handleSidebarNavigate(view: SidebarView) {
    router.push(`/?view=${view}`);
  }

  const isDraft     = post?.status === 'DRAFT' && !post.isScheduled;
  const isScheduled = post?.status === 'DRAFT' && post.isScheduled;
  const isPublished = post?.status === 'PUBLISHED';
  const isRejected  = post?.status === 'REJECTED' || post?.status === 'FAILED';

  const charCount = editContent.length;
  const overLimit = charCount > 3000;
  const isBusy    = approveMutation.isPending || editMutation.isPending || scheduleMutation.isPending ||
                    unscheduleMutation.isPending || moveToDraftMutation.isPending || publishMutation.isPending;

  function startEdit() {
    setEditTopic(post!.topic);
    setEditContent(post!.content);
    setIsEditing(true);
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] font-['Inter',sans-serif]">
      {/* Top NavBar — identical to dashboard */}
      <header className="bg-white flex justify-between items-center px-6 py-3 w-full sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <IconLinkedIn />
          <span className="text-xl font-extrabold text-[#005d8f]">LinkedIn AI Agent</span>
        </div>
        <ProfileMenu />
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        <Sidebar activeView="drafts" onNavigate={handleSidebarNavigate} />

        <main className="flex-grow p-8">
          <div className="max-w-[800px] mx-auto">
            {/* Back link */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-[#707881] hover:text-[#1b1c1a] transition-colors mb-6"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>

            {isLoading && (
              <div className="flex items-center justify-center py-20 text-[#707881] text-sm">Loading...</div>
            )}

            {(isError || (!isLoading && !post)) && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-[#707881] text-sm">Post not found.</p>
                <button onClick={() => router.back()} className="text-sm font-semibold text-[#005d8f] hover:underline">
                  Go back
                </button>
              </div>
            )}

            {post && (
              <div className="flex flex-col gap-6">
                {/* Page title + meta */}
                <div>
                  <h1 className="text-2xl font-semibold text-[#1b1c1a] tracking-tight mb-2">Post Detail</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={post.status} label={isScheduled ? 'SCHEDULED' : undefined} />
                    <span className="text-xs text-[#707881]">
                      Created {new Date(post.createdAt).toLocaleString()}
                    </span>
                    {post.publishedAt && (
                      <span className="text-xs text-[#707881]">
                        Published {new Date(post.publishedAt).toLocaleString()}
                      </span>
                    )}
                    {isScheduled && post.scheduledFor && (
                      <span className="text-xs text-blue-600 font-medium">
                        Publishes {post.scheduledFor}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image */}
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="Post image" className="w-full max-h-64 object-cover rounded-xl" />
                )}

                {/* Content card */}
                <div className="bg-white border border-[#bfc7d1] rounded-xl p-6 shadow-[0px_2px_8px_rgba(0,0,0,0.05)] flex flex-col gap-5">
                  {isEditing ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-[#707881] font-semibold">Topic</Label>
                        <Input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} className="font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs uppercase tracking-wider text-[#707881] font-semibold">Content</Label>
                          <span className={cn('text-xs', overLimit ? 'text-red-600 font-medium' : 'text-[#707881]')}>
                            {charCount}/3000
                          </span>
                        </div>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={14}
                          className={cn('resize-y text-sm leading-relaxed', overLimit && 'border-red-500 focus-visible:ring-red-500')}
                        />
                        {overLimit && <p className="text-xs text-red-600">Exceeds LinkedIn&apos;s 3000 character limit</p>}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          className="text-sm font-semibold px-5 py-2 bg-[#0077b5] text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                          onClick={() => editMutation.mutate({ postId: post.postId, topic: editTopic, content: editContent })}
                          disabled={editMutation.isPending || overLimit}
                        >
                          {editMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="text-sm px-4 py-2 text-[#707881] hover:text-[#1b1c1a] rounded-lg hover:bg-[#efeeeb] transition-colors"
                          onClick={() => setIsEditing(false)}
                          disabled={editMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#707881] font-semibold mb-1">Topic</p>
                        <p className="text-base font-semibold text-[#1b1c1a]">{post.topic}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#707881] font-semibold mb-2">Content</p>
                        <p className="text-sm text-[#404850] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </>
                  )}

                  {isPublished && post.linkedInPostId && (
                    <a
                      href={`https://www.linkedin.com/feed/update/${post.linkedInPostId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#005d8f] hover:underline"
                    >
                      View on LinkedIn →
                    </a>
                  )}

                  {post.errorMessage && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      Error: {post.errorMessage}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex flex-wrap gap-3">
                    {isDraft && (
                      <>
                        <button
                          className="text-sm font-semibold px-6 py-2.5 bg-[#0077b5] text-white rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                          onClick={() => approveMutation.mutate({ postId: post.postId, action: 'approve' })}
                          disabled={isBusy}
                        >
                          {approveMutation.isPending ? 'Posting...' : 'Post Now'}
                        </button>
                        {!showSchedule ? (
                          <button
                            className="text-sm font-semibold px-4 py-2.5 border border-[#bfc7d1] text-[#1b1c1a] rounded-lg hover:bg-[#efeeeb] transition-colors disabled:opacity-50"
                            onClick={() => setShowSchedule(true)}
                            disabled={isBusy}
                          >
                            Schedule
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              type="date"
                              value={scheduleDate}
                              min={tomorrowLocal()}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-40"
                            />
                            <button
                              className="text-sm font-semibold px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                              onClick={() => scheduleMutation.mutate({ postId: post.postId, scheduledFor: scheduleDate })}
                              disabled={isBusy}
                            >
                              {scheduleMutation.isPending ? 'Saving...' : 'Confirm'}
                            </button>
                            <button
                              className="text-sm text-[#707881] px-2 py-2 hover:text-[#1b1c1a]"
                              onClick={() => setShowSchedule(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <button
                          className="text-sm font-semibold px-4 py-2.5 border border-[#bfc7d1] text-[#1b1c1a] rounded-lg hover:bg-[#efeeeb] transition-colors disabled:opacity-50"
                          onClick={startEdit}
                          disabled={isBusy}
                        >
                          Edit
                        </button>
                        <button
                          className="text-sm font-semibold px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          onClick={() => approveMutation.mutate({ postId: post.postId, action: 'reject' })}
                          disabled={isBusy}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isScheduled && (
                      <>
                        <button
                          className="text-sm font-semibold px-6 py-2.5 bg-[#0077b5] text-white rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                          onClick={() => approveMutation.mutate({ postId: post.postId, action: 'approve' })}
                          disabled={isBusy}
                        >
                          {approveMutation.isPending ? 'Posting...' : 'Post Now'}
                        </button>
                        <button
                          className="text-sm font-semibold px-4 py-2.5 border border-[#bfc7d1] text-[#1b1c1a] rounded-lg hover:bg-[#efeeeb] transition-colors disabled:opacity-50"
                          onClick={() => unscheduleMutation.mutate(post.postId)}
                          disabled={isBusy}
                        >
                          {unscheduleMutation.isPending ? 'Moving...' : 'Move to Drafts'}
                        </button>
                        <button
                          className="text-sm font-semibold px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          onClick={() => approveMutation.mutate({ postId: post.postId, action: 'reject' })}
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {isRejected && (
                      <button
                        className="text-sm font-semibold px-4 py-2.5 text-[#005d8f] hover:bg-[#d9e4ea] rounded-lg transition-colors disabled:opacity-50"
                        onClick={() => moveToDraftMutation.mutate(post.postId)}
                        disabled={isBusy}
                      >
                        {moveToDraftMutation.isPending ? 'Moving...' : 'Move to Drafts'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileNav activeView="drafts" onNavigate={handleSidebarNavigate} />
    </div>
  );
}
