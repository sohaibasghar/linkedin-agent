'use client';

import { useState, useRef } from 'react';
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
            onClick={() => onDone(draft.postId)}
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generateMutation = useGeneratePost({ onSuccess: onGenerated });

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (generateMutation.isPending) return;
    generateMutation.mutate({ subject: subject.trim() || undefined, withImage });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn(
        'bg-white rounded-2xl border transition-all shadow-[0_2px_16px_rgba(0,0,0,0.08)]',
        generateMutation.isPending
          ? 'border-[#0077b5]/40'
          : 'border-[#e2e8ed] focus-within:border-[#0077b5]/60 focus-within:shadow-[0_4px_24px_rgba(0,119,181,0.12)]'
      )}>
        {/* Auto-growing textarea */}
        <textarea
          ref={textareaRef}
          value={subject}
          onChange={(e) => { setSubject(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to write about? (Leave blank and AI will choose)"
          disabled={generateMutation.isPending}
          rows={1}
          className="w-full px-5 pt-4 pb-2 text-sm text-[#1b1c1a] placeholder-[#9ca3af] resize-none outline-none bg-transparent leading-relaxed disabled:opacity-60"
          style={{ minHeight: '56px', maxHeight: '200px' }}
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={() => setWithImage((v) => !v)}
            disabled={generateMutation.isPending}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all',
              withImage
                ? 'bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/30'
                : 'text-[#707881] border-transparent hover:bg-[#f3f2ef]'
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {withImage ? 'Image on' : 'Add image'}
          </button>

          <button
            type="submit"
            disabled={generateMutation.isPending}
            aria-label="Generate post"
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl transition-all',
              generateMutation.isPending
                ? 'bg-[#0077b5]/50 cursor-not-allowed'
                : 'bg-[#0077b5] hover:bg-[#005d8f] shadow-sm active:scale-95'
            )}
          >
            {generateMutation.isPending ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {generateMutation.isPending && (
        <p className="mt-3 text-xs text-[#707881] text-center animate-pulse">
          {withImage ? 'Generating post and image — this may take a moment…' : 'Generating your post…'}
        </p>
      )}

      {generateMutation.isError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(generateMutation.error as Error).message}
        </div>
      )}
    </form>
  );
}
