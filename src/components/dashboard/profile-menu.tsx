'use client';

import { useState, useRef } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';
import { IconLogout } from './icons';

export function ProfileMenu() {
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
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
          <img
            src={user.avatarUrl}
            alt={user.name ?? 'Profile'}
            className="w-8 h-8 rounded-full border border-gray-200 object-cover"
          />
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
  );
}
