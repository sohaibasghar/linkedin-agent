'use client';

import { cn } from '@/lib/utils';
import { IconAutoAwesome, IconLibrary, IconSchedule, IconHistory, IconHelp, IconLogout } from './icons';
import type { SidebarView } from './helpers';

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left text-sm font-semibold transition-all duration-200',
        active
          ? 'bg-white text-[#005d8f] shadow-sm border border-gray-200'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function Sidebar({
  activeView,
  onNavigate,
}: {
  activeView: SidebarView;
  onNavigate: (view: SidebarView) => void;
}) {
  return (
    <aside className="hidden lg:flex flex-col p-4 space-y-2 bg-gray-50 w-64 border-r border-gray-200 text-sm font-semibold sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
      {/* Branding */}
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <div className="w-10 h-10 bg-[#0077b5] rounded-lg flex items-center justify-center text-white">
          <IconAutoAwesome />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">AI Workflow</div>
          <div className="text-xs font-normal text-gray-500">Content Manager</div>
        </div>
      </div>

      {/* Create new post */}
      <button
        onClick={() => onNavigate('generate')}
        className="w-full bg-[#0077b5] text-white py-2.5 rounded-lg text-sm font-semibold mb-4 shadow-sm hover:opacity-90 transition-all"
      >
        Create New Post
      </button>

      {/* Nav items */}
      <nav className="space-y-1 flex-grow">
        <SidebarItem
          icon={<IconAutoAwesome className="text-current" />}
          label="Generation"
          active={activeView === 'generate'}
          onClick={() => onNavigate('generate')}
        />
        <SidebarItem
          icon={<IconLibrary className="text-current" />}
          label="Content Library"
          active={activeView === 'drafts'}
          onClick={() => onNavigate('drafts')}
        />
        <SidebarItem
          icon={<IconSchedule className="text-current" />}
          label="Scheduled"
          active={activeView === 'scheduled'}
          onClick={() => onNavigate('scheduled')}
        />
        <SidebarItem
          icon={<IconHistory className="text-current" />}
          label="History"
          active={activeView === 'history'}
          onClick={() => onNavigate('history')}
        />
      </nav>

      {/* Bottom nav */}
      <div className="pt-4 mt-auto space-y-1 border-t border-gray-200">
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <IconHelp /> Help Center
        </a>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
            <IconLogout /> Log Out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav({
  activeView,
  onNavigate,
}: {
  activeView: SidebarView;
  onNavigate: (view: SidebarView) => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <button onClick={() => onNavigate('generate')} className={cn('flex flex-col items-center gap-1 px-3 py-1 text-xs', activeView === 'generate' ? 'text-[#005d8f]' : 'text-gray-500')}>
        <IconAutoAwesome className="w-5 h-5" />
        Generate
      </button>
      <button onClick={() => onNavigate('drafts')} className={cn('flex flex-col items-center gap-1 px-3 py-1 text-xs', activeView === 'drafts' ? 'text-[#005d8f]' : 'text-gray-500')}>
        <IconLibrary className="w-5 h-5" />
        Library
      </button>
      <button onClick={() => onNavigate('scheduled')} className={cn('flex flex-col items-center gap-1 px-3 py-1 text-xs', activeView === 'scheduled' ? 'text-[#005d8f]' : 'text-gray-500')}>
        <IconSchedule className="w-5 h-5" />
        Scheduled
      </button>
      <button onClick={() => onNavigate('history')} className={cn('flex flex-col items-center gap-1 px-3 py-1 text-xs', activeView === 'history' ? 'text-[#005d8f]' : 'text-gray-500')}>
        <IconHistory className="w-5 h-5" />
        History
      </button>
    </nav>
  );
}
