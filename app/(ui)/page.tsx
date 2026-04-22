'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  postKeys,
  DRAFT_PAGE_SIZE,
  useDrafts,
  useScheduledPosts,
  usePublishedPosts,
  useRejectedPosts,
  useFailedPosts,
  useApprovePost,
  useEditPost,
  useSchedulePost,
  useUnschedulePost,
  useMoveToDraft,
  usePublishPost,
  useSavePost,
  useGeneratePost,
} from '@/hooks/posts';
import type { PostStatus, GeneratedDraft } from '@/hooks/posts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tomorrowLocal(): string {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function StatusBadge({ status }: { status: PostStatus }) {
  const colorClass: Record<PostStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
    APPROVED: 'bg-blue-100 text-blue-700 border-blue-200',
    PUBLISHED: 'bg-green-100 text-green-700 border-green-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
    REJECTED: 'bg-gray-100 text-gray-400 border-gray-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colorClass[status]
      )}
    >
      {status}
    </span>
  );
}

// ─── Drafts Tab ───────────────────────────────────────────────────────────────

function DraftsTab({ excludeIds }: { excludeIds: Set<string> }) {
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editContent, setEditContent] = useState('');
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(tomorrowLocal());

  const { data, isLoading } = useDrafts(page);

  const approveMutation = useApprovePost();
  const editMutation = useEditPost({ onSuccess: () => setEditingId(null) });
  const scheduleMutation = useSchedulePost({ onSuccess: () => setSchedulingId(null) });

  const visiblePosts = (data?.posts ?? []).filter((p) => !excludeIds.has(p.postId));
  const total = Math.max(0, (data?.total ?? 0) - excludeIds.size);
  const totalPages = Math.ceil(total / DRAFT_PAGE_SIZE);

  const editCharCount = editContent.length;
  const editOverLimit = editCharCount > 3000;

  if (isLoading) {
    return <LoadingState />;
  }

  if (visiblePosts.length === 0) {
    return <EmptyState message="No draft posts." hint="Generate a post above to get started." />;
  }

  return (
    <div className="space-y-4">
      {visiblePosts.map((post) => {
        const isEditing = editingId === post.postId;
        const isScheduling = schedulingId === post.postId;

        return (
          <Card key={post.postId}>
            <CardContent className="pt-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Topic</Label>
                    <Input
                      value={editTopic}
                      onChange={(e) => setEditTopic(e.target.value)}
                      className="font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Content</Label>
                      <span className={cn('text-xs', editOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                        {editCharCount}/3000
                      </span>
                    </div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={6}
                      className={cn('resize-y text-sm leading-relaxed', editOverLimit && 'border-destructive focus-visible:ring-destructive')}
                    />
                    {editOverLimit && (
                      <p className="text-xs text-destructive">Exceeds LinkedIn&apos;s 3000 character limit</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => editMutation.mutate({ postId: post.postId, topic: editTopic, content: editContent })}
                      disabled={editMutation.isPending || editOverLimit}
                    >
                      {editMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={editMutation.isPending}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status="DRAFT" />
                    </div>
                    <p className="font-semibold text-sm truncate">{post.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created {new Date(post.createdAt).toLocaleString()}
                    </p>
                    <PostContentPreview content={post.content} />
                    {post.imageUrl && (
                      <a href={post.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View image →
                      </a>
                    )}
                    {isScheduling && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Input type="date" value={scheduleDate} min={tomorrowLocal()} onChange={(e) => setScheduleDate(e.target.value)} className="w-40" />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-violet-600 text-white hover:bg-violet-700"
                          onClick={() => scheduleMutation.mutate({ postId: post.postId, scheduledFor: scheduleDate })}
                          disabled={scheduleMutation.isPending}
                        >
                          {scheduleMutation.isPending ? 'Saving…' : 'Confirm'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSchedulingId(null)} className="text-muted-foreground">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate({ postId: post.postId, action: 'approve' })}
                      disabled={approveMutation.isPending || scheduleMutation.isPending}
                    >
                      {approveMutation.isPending &&
                      approveMutation.variables?.postId === post.postId &&
                      approveMutation.variables?.action === 'approve'
                        ? 'Posting…'
                        : 'Post Now'}
                    </Button>
                    {!isScheduling && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-violet-700 border-violet-300 hover:bg-violet-50"
                        onClick={() => {
                          setSchedulingId(post.postId);
                          setScheduleDate(tomorrowLocal());
                          setEditingId(null);
                        }}
                        disabled={approveMutation.isPending}
                      >
                        Schedule
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(post.postId);
                        setEditTopic(post.topic);
                        setEditContent(post.content);
                        setSchedulingId(null);
                      }}
                      disabled={approveMutation.isPending || scheduleMutation.isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                      onClick={() => approveMutation.mutate({ postId: post.postId, action: 'reject' })}
                      disabled={approveMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Pagination page={page} totalPages={totalPages} isLoading={isLoading} onPageChange={setPage} />
    </div>
  );
}

// ─── Scheduled Tab ────────────────────────────────────────────────────────────

function ScheduledTab({ excludeIds }: { excludeIds: Set<string> }) {
  const { data, isLoading } = useScheduledPosts();

  const cancelMutation = useApprovePost();
  const postNowMutation = useApprovePost();
  const unscheduleMutation = useUnschedulePost();

  const scheduledPosts = (data?.posts ?? []).filter((p) => !excludeIds.has(p.postId));

  if (isLoading) {
    return <LoadingState />;
  }

  if (scheduledPosts.length === 0) {
    return (
      <EmptyState
        message="No scheduled posts."
        hint='Use "Schedule" when generating a post to queue it for a future date.'
      />
    );
  }

  return (
    <div className="space-y-4">
      {scheduledPosts.map((post) => (
        <Card key={post.postId} className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status="DRAFT" />
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    SCHEDULED
                  </span>
                </div>
                <p className="font-semibold text-sm truncate">{post.topic}</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Publishes {post.scheduledFor} · Created {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <PostContentPreview content={post.content} maxLen={200} borderClass="border-blue-200" />
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-700 hover:bg-green-800"
                  onClick={() => postNowMutation.mutate({ postId: post.postId, action: 'approve' })}
                  disabled={postNowMutation.isPending || unscheduleMutation.isPending}
                >
                  Post Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unscheduleMutation.mutate(post.postId)}
                  disabled={unscheduleMutation.isPending || postNowMutation.isPending}
                >
                  {unscheduleMutation.isPending && unscheduleMutation.variables === post.postId ? 'Moving…' : 'Edit Draft'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                  onClick={() => cancelMutation.mutate({ postId: post.postId, action: 'reject' })}
                  disabled={cancelMutation.isPending || postNowMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Published Tab ────────────────────────────────────────────────────────────

const HISTORY_PAGE_SIZE = 10;

function PublishedTab() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = usePublishedPosts();

  const allPosts = (data?.posts ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalPages = Math.ceil(allPosts.length / HISTORY_PAGE_SIZE);
  const pagePosts = allPosts.slice(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE);

  if (isLoading) return <LoadingState />;
  if (allPosts.length === 0) return <EmptyState message="No published posts yet." />;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              {['Topic', 'Status', 'Scheduled', 'Published'].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold text-xs text-muted-foreground border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagePosts.map((post) => (
              <tr key={post.postId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2.5 max-w-[200px]">
                  {post.linkedInPostId ? (
                    <a
                      href={`https://www.linkedin.com/feed/update/${post.linkedInPostId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate block"
                      title={post.topic}
                    >
                      {post.topic}
                    </a>
                  ) : (
                    <span className="truncate block" title={post.topic}>{post.topic}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <StatusBadge status={post.status} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{post.scheduledFor}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
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

// ─── Rejected Tab ─────────────────────────────────────────────────────────────

const REJECTED_PAGE_SIZE = 10;

function RejectedTab() {
  const [page, setPage] = useState(0);
  const { data: rejectedData, isLoading: l1 } = useRejectedPosts();
  const { data: failedData, isLoading: l2 } = useFailedPosts();
  const moveToDraftMutation = useMoveToDraft();

  const isLoading = l1 || l2;

  const allPosts = [
    ...(rejectedData?.posts ?? []),
    ...(failedData?.posts ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.ceil(allPosts.length / REJECTED_PAGE_SIZE);
  const pagePosts = allPosts.slice(page * REJECTED_PAGE_SIZE, (page + 1) * REJECTED_PAGE_SIZE);

  if (isLoading) return <LoadingState />;
  if (allPosts.length === 0) return <EmptyState message="No rejected or failed posts." />;

  return (
    <div className="space-y-4">
      {pagePosts.map((post) => (
        <Card key={post.postId} className={post.status === 'FAILED' ? 'border-red-200 bg-red-50/30' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={post.status} />
                  <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-semibold text-sm truncate">{post.topic}</p>
                <PostContentPreview content={post.content} />
                {post.errorMessage && (
                  <p className="text-xs text-destructive mt-2">Error: {post.errorMessage}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveToDraftMutation.mutate(post.postId)}
                  disabled={moveToDraftMutation.isPending}
                >
                  {moveToDraftMutation.isPending && moveToDraftMutation.variables === post.postId
                    ? 'Moving…'
                    : 'Move to Drafts'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Generated post preview ──────────────────────────────────────────────────

function GeneratedPreview({
  draft,
  onDone,
}: {
  draft: GeneratedDraft;
  onDone: (postId: string) => void;
}) {
  const [topic, setTopic] = useState(draft.topic);
  const [content, setContent] = useState(draft.content);
  const [dirty, setDirty] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(tomorrowLocal());
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [done, setDone] = useState(false);
  const qc = useQueryClient();

  const charCount = content.length;
  const overLimit = charCount > 3000;

  const saveMutation = useSavePost();

  const publishMutation = usePublishPost();
  const scheduleMutation = useSchedulePost();

  const isBusy = saveMutation.isPending || publishMutation.isPending || scheduleMutation.isPending;

  function handleDone() {
    setDone(true);
    setTimeout(() => onDone(draft.postId), 1200);
  }

  async function handlePostNow() {
    if (dirty) await saveMutation.mutateAsync({ postId: draft.postId, topic, content });
    publishMutation.mutate(draft.postId, { onSuccess: handleDone });
  }

  async function handleSchedule() {
    if (dirty) await saveMutation.mutateAsync({ postId: draft.postId, topic, content });
    scheduleMutation.mutate(
      { postId: draft.postId, scheduledFor: scheduleDate },
      { onSuccess: handleDone }
    );
  }

  async function handleSaveAsDraft() {
    if (dirty) await saveMutation.mutateAsync({ postId: draft.postId, topic, content });
    qc.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' });
    onDone(draft.postId);
  }

  return (
    <Card className="mt-4 border-2 border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-primary">Generated Post</CardTitle>
          {!done && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                qc.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' });
                onDone(draft.postId);
              }}
              className="h-7 w-7 p-0 text-muted-foreground"
            >
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Topic</Label>
          <Input
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setDirty(true); }}
            className="font-medium"
          />
        </div>

        {draft.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.imageUrl} alt="Generated" className="w-full max-h-48 object-cover rounded-lg" />
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Content</Label>
            <span className={cn('text-xs', overLimit ? 'text-destructive font-medium' : 'text-muted-foreground')}>
              {charCount}/3000
            </span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setDirty(true); }}
            rows={10}
            className={cn('resize-y text-sm leading-relaxed', overLimit && 'border-destructive focus-visible:ring-destructive')}
          />
          {overLimit && (
            <p className="text-xs text-destructive">Exceeds LinkedIn&apos;s 3000 character limit</p>
          )}
        </div>

        {dirty && !done && (
          <p className="text-xs text-amber-600">Unsaved edits — auto-saved on publish/schedule</p>
        )}

        {!done && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handlePostNow} disabled={isBusy || overLimit}>
              {publishMutation.isPending ? 'Posting…' : 'Post Now'}
            </Button>

            {!showSchedulePicker ? (
              <Button variant="outline" onClick={() => setShowSchedulePicker(true)} disabled={isBusy}>
                Schedule
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={scheduleDate}
                  min={tomorrowLocal()}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-40"
                />
                <Button
                  variant="secondary"
                  className="bg-violet-600 text-white hover:bg-violet-700"
                  onClick={handleSchedule}
                  disabled={isBusy || overLimit}
                >
                  {scheduleMutation.isPending ? 'Saving…' : 'Confirm Schedule'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSchedulePicker(false)} className="text-muted-foreground">
                  Cancel
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              className="text-muted-foreground text-sm"
              onClick={handleSaveAsDraft}
              disabled={isBusy}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save as Draft'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Generate form ────────────────────────────────────────────────────────────

function GenerateForm({ onGenerated }: { onGenerated: (draft: GeneratedDraft) => void }) {
  const [subject, setSubject] = useState('');
  const [withImage, setWithImage] = useState(false);

  const generateMutation = useGeneratePost({ onSuccess: onGenerated });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Generate Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateMutation.mutate({ subject: subject.trim() || undefined, withImage });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label htmlFor="subject" className="text-sm">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Topic to write about (leave blank for AI to choose)"
              disabled={generateMutation.isPending}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pb-0.5 shrink-0 text-sm">
            <input
              type="checkbox"
              checked={withImage}
              onChange={(e) => setWithImage(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
              disabled={generateMutation.isPending}
            />
            Add image
          </label>

          <Button type="submit" disabled={generateMutation.isPending} className="shrink-0">
            {generateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating…
              </span>
            ) : (
              'Generate Post'
            )}
          </Button>
        </form>

        {generateMutation.isError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(generateMutation.error as Error).message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      Loading…
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
      <p className="text-sm">{message}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  );
}

function PostContentPreview({
  content,
  maxLen = 280,
  borderClass = 'border-border',
}: {
  content: string;
  maxLen?: number;
  borderClass?: string;
}) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-2 line-clamp-2 whitespace-pre-wrap border-l-2 pl-3', borderClass)}>
      {content.slice(0, maxLen)}
      {content.length > maxLen ? '…' : ''}
    </p>
  );
}

function Pagination({
  page,
  totalPages,
  isLoading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0 || isLoading}>
        ← Prev
      </Button>
      <span className="text-sm text-muted-foreground">
        {page + 1} / {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1 || isLoading}>
        Next →
      </Button>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedDraft[]>([]);
  const qc = useQueryClient();

  const previewIds = new Set(generatedDrafts.map((d) => d.postId));

  function handleGenerated(draft: GeneratedDraft) {
    setGeneratedDrafts((prev) => [draft, ...prev]);
    qc.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' });
  }

  function dismissDraft(postId: string) {
    setGeneratedDrafts((prev) => prev.filter((d) => d.postId !== postId));
  }

  // Count badges — reuse same query keys as tabs so no extra requests
  const { data: draftCountData }     = useDrafts(0);
  const { data: scheduledCountData } = useScheduledPosts();
  const { data: publishedCountData } = usePublishedPosts();
  const { data: rejectedCountData }  = useRejectedPosts();
  const { data: failedCountData }    = useFailedPosts();

  const draftCount     = Math.max(0, (draftCountData?.total ?? 0) - previewIds.size);
  const scheduledCount = scheduledCountData?.total ?? 0;
  const publishedCount = publishedCountData?.total ?? 0;
  const rejectedCount  = (rejectedCountData?.total ?? 0) + (failedCountData?.total ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-8 pb-4 border-b">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a66c2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span className="text-lg font-bold text-[#0a66c2]">LinkedIn AI Agent</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Account
            </a>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer p-0"
              >
                Disconnect
              </button>
            </form>
          </div>
        </nav>

        {/* Generate form */}
        <div className="mb-8">
          <GenerateForm onGenerated={handleGenerated} />
          {generatedDrafts.map((draft) => (
            <GeneratedPreview key={draft.postId} draft={draft} onDone={dismissDraft} />
          ))}
        </div>

        <Separator className="mb-6" />

        {/* Tabs */}
        <Tabs defaultValue="drafts">
          <TabsList className="mb-4 w-full grid grid-cols-4">
            <TabsTrigger value="drafts" className="flex items-center gap-1.5">
              Drafts
              {draftCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary px-2 py-0 text-xs font-semibold">{draftCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-1.5">
              Scheduled
              {scheduledCount > 0 && (
                <span className="ml-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0 text-xs font-semibold">{scheduledCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="flex items-center gap-1.5">
              Published
              {publishedCount > 0 && (
                <span className="ml-1 rounded-full bg-green-100 text-green-700 px-2 py-0 text-xs font-semibold">{publishedCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-1.5">
              Rejected
              {rejectedCount > 0 && (
                <span className="ml-1 rounded-full bg-red-100 text-red-700 px-2 py-0 text-xs font-semibold">{rejectedCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts">
            <DraftsTab excludeIds={previewIds} />
          </TabsContent>
          <TabsContent value="scheduled">
            <ScheduledTab excludeIds={previewIds} />
          </TabsContent>
          <TabsContent value="published">
            <PublishedTab />
          </TabsContent>
          <TabsContent value="rejected">
            <RejectedTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
