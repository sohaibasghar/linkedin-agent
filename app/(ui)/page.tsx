'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  postKeys,
  useDrafts,
  useScheduledPosts,
  usePublishedPosts,
  useRejectedPosts,
  useFailedPosts,
} from '@/hooks/posts';
import type { GeneratedDraft } from '@/hooks/posts';
import {
  IconLinkedIn,
  Sidebar,
  MobileNav,
  ProfileMenu,
  GenerateForm,
  GeneratedPreview,
  DraftsView,
  ScheduledView,
  PublishedView,
  RejectedView,
  SegmentedTabs,
} from '@/components/dashboard';
import type { SidebarView } from '@/components/dashboard';

export default function Dashboard() {
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedDraft[]>([]);
  const [activeView, setActiveView] = useState<SidebarView>('drafts');
  const [contentTab, setContentTab] = useState('drafts');
  const qc = useQueryClient();

  const previewIds = new Set(generatedDrafts.map((d) => d.postId));

  function handleGenerated(draft: GeneratedDraft) {
    setGeneratedDrafts((prev) => [draft, ...prev]);
    qc.invalidateQueries({ queryKey: postKeys.all, refetchType: 'all' });
  }

  function dismissDraft(postId: string) {
    setGeneratedDrafts((prev) => prev.filter((d) => d.postId !== postId));
  }

  function handleSidebarNavigate(view: SidebarView) {
    setActiveView(view);
    if (view === 'drafts') setContentTab('drafts');
    if (view === 'history') setContentTab('published');
  }

  // Counts
  const { data: draftCountData } = useDrafts(0);
  const { data: scheduledCountData } = useScheduledPosts();
  const { data: publishedCountData } = usePublishedPosts();
  const { data: rejectedCountData } = useRejectedPosts();
  const { data: failedCountData } = useFailedPosts();

  const draftCount = Math.max(0, (draftCountData?.total ?? 0) - previewIds.size);
  const scheduledCount = scheduledCountData?.total ?? 0;
  const publishedCount = publishedCountData?.total ?? 0;
  const rejectedCount = (rejectedCountData?.total ?? 0) + (failedCountData?.total ?? 0);

  return (
    <div className="min-h-screen bg-[#F3F2EF] font-['Inter',sans-serif]">
      {/* Top NavBar */}
      <header className="bg-white flex justify-between items-center px-6 py-3 w-full sticky top-0 z-50 shadow-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <IconLinkedIn />
          <span className="text-xl font-extrabold text-[#005d8f]">LinkedIn AI Agent</span>
        </div>
        <ProfileMenu />
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        <Sidebar activeView={activeView} onNavigate={handleSidebarNavigate} />

        <main className="flex-grow p-8">
          <div className="max-w-[800px] mx-auto">
            {/* Generation View */}
            {activeView === 'generate' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1b1c1a] tracking-tight mb-6">Generate Content</h1>
                <GenerateForm onGenerated={handleGenerated} />
                {generatedDrafts.map((draft) => (
                  <GeneratedPreview key={draft.postId} draft={draft} onDone={dismissDraft} />
                ))}
                <div className="mt-10">
                  <h2 className="text-base font-semibold text-[#404850] mb-4">Recent Drafts</h2>
                  <DraftsView excludeIds={previewIds} />
                </div>
              </div>
            )}

            {/* Content Library View */}
            {activeView === 'drafts' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1b1c1a] tracking-tight mb-6">Content Management</h1>
                <div className="mb-8">
                  <SegmentedTabs
                    tabs={[
                      { value: 'drafts', label: 'Drafts', count: draftCount },
                      { value: 'scheduled', label: 'Scheduled', count: scheduledCount },
                      { value: 'published', label: 'Published', count: publishedCount },
                    ]}
                    active={contentTab}
                    onChange={setContentTab}
                  />
                </div>
                {contentTab === 'drafts' && <DraftsView excludeIds={previewIds} />}
                {contentTab === 'scheduled' && <ScheduledView excludeIds={previewIds} />}
                {contentTab === 'published' && <PublishedView />}
              </div>
            )}

            {/* Scheduled View */}
            {activeView === 'scheduled' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1b1c1a] tracking-tight mb-6">Scheduled Posts</h1>
                <ScheduledView excludeIds={previewIds} />
              </div>
            )}

            {/* History View */}
            {activeView === 'history' && (
              <div>
                <h1 className="text-2xl font-semibold text-[#1b1c1a] tracking-tight mb-6">History</h1>
                <div className="mb-8">
                  <SegmentedTabs
                    tabs={[
                      { value: 'published', label: 'Published', count: publishedCount },
                      { value: 'rejected', label: 'Rejected', count: rejectedCount },
                    ]}
                    active={contentTab === 'rejected' ? 'rejected' : 'published'}
                    onChange={setContentTab}
                  />
                </div>
                {contentTab === 'rejected' ? <RejectedView /> : <PublishedView />}
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileNav activeView={activeView} onNavigate={handleSidebarNavigate} />
    </div>
  );
}
