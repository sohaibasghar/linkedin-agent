'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { IconLogout } from './icons';

// ── Timezone helpers ──────────────────────────────────────────────────────────

function utcToLocal(utcTime: string): string {
  const [h, m] = utcTime.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(h!, m!, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function localToUtc(localTime: string): string {
  const [h, m] = localTime.split(':').map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ── Settings modal ────────────────────────────────────────────────────────────

function SettingsModal({ publishTime, onClose }: { publishTime: string; onClose: () => void }) {
  const [value, setValue] = useState(() => utcToLocal(publishTime));
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const tz = localTimezone();
  const utcValue = localToUtc(value);
  const [utcH] = utcValue.split(':').map(Number);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch('/api/settings', { publishTime: utcValue });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(`Publish time set to ${value} (${tz})`);
      onClose();
    } catch {
      toast.error('Failed to save publish time');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-84 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900 mb-1">Daily Publish Time</h2>
        <p className="text-xs text-gray-500 mb-4">
          Scheduled posts publish once per day at this time ({tz}).
        </p>

        <input
          type="time"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5] mb-3"
        />

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Update vercel.json to apply</p>
          <p>Set your cron schedule to match:</p>
          <code className="block bg-amber-100 rounded px-2 py-1 font-mono text-xs select-all">
            {`"schedule": "0 ${utcH} * * *"`}
          </code>
          <p className="text-amber-600">Then redeploy for the new time to take effect.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-[#0077b5] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Clock icon ────────────────────────────────────────────────────────────────

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Profile menu ──────────────────────────────────────────────────────────────

export function ProfileMenu() {
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          onBlur={(e) => {
            if (!menuRef.current?.contains(e.relatedTarget)) setOpen(false);
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name ?? 'Profile'} className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0077b5] text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          )}
          {user?.name && (
            <span className="hidden md:inline text-sm font-medium text-gray-700">{user.name}</span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50"
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              onClick={() => { setOpen(false); setShowSettings(true); }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
            >
              <IconClock />
              Publish Time
              {user?.publishTime && (
                <span className="ml-auto text-xs text-gray-400 font-mono">{utcToLocal(user.publishTime)}</span>
              )}
            </button>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <IconLogout className="w-4 h-4" />
                Log Out
              </button>
            </form>
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          publishTime={user?.publishTime ?? '08:00'}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
