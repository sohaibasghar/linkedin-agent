'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { postKeys, usePublishPost, useSavePost, useSchedulePost, useGeneratePost } from '@/hooks/posts';
import type { GeneratedDraft } from '@/hooks/posts';
import { tomorrowLocal } from './helpers';

// ─── Generated Preview ───────────────────────────────────────────────────────

export function GeneratedPreview({
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
    <div className="bg-white border-2 border-[#0077b5] p-6 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.05)] mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#005d8f]">Generated Post</h3>
        {!done && (
          <button
            onClick={() => { qc.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' }); onDone(draft.postId); }}
            className="text-[#707881] hover:text-[#1b1c1a] text-lg leading-none p-1"
          >
            &times;
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-[#707881] font-semibold">Topic</Label>
          <Input value={topic} onChange={(e) => { setTopic(e.target.value); setDirty(true); }} className="font-medium" />
        </div>

        {draft.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.imageUrl} alt="Generated" className="w-full max-h-48 object-cover rounded-lg" />
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-[#707881] font-semibold">Content</Label>
            <span className={cn('text-xs', overLimit ? 'text-red-600 font-medium' : 'text-[#707881]')}>
              {charCount}/3000
            </span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setDirty(true); }}
            rows={10}
            className={cn('resize-y text-sm leading-relaxed', overLimit && 'border-red-500 focus-visible:ring-red-500')}
          />
          {overLimit && <p className="text-xs text-red-600">Exceeds LinkedIn&apos;s 3000 character limit</p>}
        </div>

        {dirty && !done && (
          <p className="text-xs text-amber-600">Unsaved edits — auto-saved on publish/schedule</p>
        )}

        {!done && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              className="text-sm font-semibold px-6 py-2.5 bg-[#0077b5] text-white rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
              onClick={handlePostNow}
              disabled={isBusy || overLimit}
            >
              {publishMutation.isPending ? 'Posting...' : 'Post Now'}
            </button>

            {!showSchedulePicker ? (
              <button
                className="text-sm font-semibold px-4 py-2.5 border border-[#bfc7d1] text-[#1b1c1a] rounded-lg hover:bg-[#efeeeb] transition-colors disabled:opacity-50"
                onClick={() => setShowSchedulePicker(true)}
                disabled={isBusy}
              >
                Schedule
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Input type="date" value={scheduleDate} min={tomorrowLocal()} onChange={(e) => setScheduleDate(e.target.value)} className="w-40" />
                <button
                  className="text-sm font-semibold px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                  onClick={handleSchedule}
                  disabled={isBusy || overLimit}
                >
                  {scheduleMutation.isPending ? 'Saving...' : 'Confirm Schedule'}
                </button>
                <button className="text-sm text-[#707881] px-2 py-2 hover:text-[#1b1c1a]" onClick={() => setShowSchedulePicker(false)}>
                  Cancel
                </button>
              </div>
            )}

            <button
              className="text-sm text-[#707881] px-4 py-2.5 hover:text-[#1b1c1a] transition-colors disabled:opacity-50"
              onClick={handleSaveAsDraft}
              disabled={isBusy}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save as Draft'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generate Form ───────────────────────────────────────────────────────────

export function GenerateForm({ onGenerated }: { onGenerated: (draft: GeneratedDraft) => void }) {
  const [subject, setSubject] = useState('');
  const [withImage, setWithImage] = useState(false);

  const generateMutation = useGeneratePost({ onSuccess: onGenerated });

  return (
    <div className="bg-white border border-[#bfc7d1] p-6 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.05)]">
      <h2 className="text-lg font-semibold text-[#1b1c1a] mb-4">Generate New Post</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generateMutation.mutate({ subject: subject.trim() || undefined, withImage });
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <Label htmlFor="subject" className="text-sm text-[#404850]">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Topic to write about (leave blank for AI to choose)"
            disabled={generateMutation.isPending}
            className="bg-[#faf9f6] border-[#bfc7d1]"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer pb-0.5 shrink-0 text-sm text-[#404850]">
          <input
            type="checkbox"
            checked={withImage}
            onChange={(e) => setWithImage(e.target.checked)}
            className="w-4 h-4 accent-[#0077b5] cursor-pointer"
            disabled={generateMutation.isPending}
          />
          Add image
        </label>

        <button
          type="submit"
          disabled={generateMutation.isPending}
          className="text-sm font-semibold px-6 py-2.5 bg-[#0077b5] text-white rounded-lg shadow-sm hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
        >
          {generateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Post'
          )}
        </button>
      </form>

      {generateMutation.isError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(generateMutation.error as Error).message}
        </div>
      )}
    </div>
  );
}
