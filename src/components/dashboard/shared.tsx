import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { PostStatus } from '@/hooks/posts';

// ─── Status Badge ────────────────────────────────────────────────────────────

export function StatusBadge({ status, label }: { status: PostStatus; label?: string }) {
  const colorClass: Record<PostStatus, string> = {
    DRAFT: 'bg-[#d9e4ea] text-[#005d8f]',
    APPROVED: 'bg-blue-100 text-blue-700',
    PUBLISHED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-gray-200 text-gray-500',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', colorClass[status])}>
      {label ?? status}
    </span>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────

export function PostCard({
  topic,
  content,
  status,
  createdAt,
  imageUrl,
  href,
  children,
  borderClass,
}: {
  topic: string;
  content: string;
  status: PostStatus;
  createdAt: string;
  imageUrl?: string | null;
  href?: string;
  children?: React.ReactNode;
  borderClass?: string;
}) {
  const body = (
    <>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn('text-base font-semibold text-[#1b1c1a]', href && 'group-hover:text-[#005d8f] transition-colors')}>{topic}</span>
            <StatusBadge status={status} />
          </div>
          <span className="text-xs text-[#707881]">
            Created {new Date(createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {imageUrl && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Post image" className="w-full h-full object-cover" />
        </div>
      )}

      <p className="text-sm text-[#404850] leading-relaxed line-clamp-3 whitespace-pre-wrap">
        {content}
      </p>
    </>
  );

  return (
    <div className={cn(
      'bg-white border border-[#bfc7d1] p-6 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.05)] flex flex-col gap-4',
      borderClass
    )}>
      {href ? (
        <Link href={href} className="group flex flex-col gap-4 cursor-pointer">
          {body}
        </Link>
      ) : body}

      {children && (
        <div className="mt-2 pt-4 border-t border-[#efeeeb] flex justify-end items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────────────────────

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-[#707881] text-sm">
      Loading...
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 text-[#707881]">
      <p className="text-sm">{message}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export function Pagination({
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
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        className="text-sm font-semibold px-4 py-2 border border-[#bfc7d1] rounded-lg hover:bg-[#efeeeb] transition-colors disabled:opacity-40"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0 || isLoading}
      >
        Prev
      </button>
      <span className="text-sm text-[#707881]">{page + 1} / {totalPages}</span>
      <button
        className="text-sm font-semibold px-4 py-2 border border-[#bfc7d1] rounded-lg hover:bg-[#efeeeb] transition-colors disabled:opacity-40"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1 || isLoading}
      >
        Next
      </button>
    </div>
  );
}

// ─── Segmented Tabs ──────────────────────────────────────────────────────────

export function SegmentedTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="bg-[#efeeeb] p-1 rounded-xl flex w-full max-w-md">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all',
            active === tab.value
              ? 'bg-white shadow-sm text-[#005d8f]'
              : 'text-[#505a5f] hover:bg-[#e9e8e5]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="ml-1.5 text-xs">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
