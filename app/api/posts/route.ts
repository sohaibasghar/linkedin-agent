export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/session';
import type { PostStatus } from '@/types';

const VALID_STATUSES = new Set(['DRAFT', 'APPROVED', 'PUBLISHED', 'FAILED', 'REJECTED']);
const DEFAULT_LIMIT  = 20;
const MAX_LIMIT      = 200;

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const statusParam      = searchParams.get('status');
  const limitParam       = searchParams.get('limit');
  const offsetParam      = searchParams.get('offset');
  const fromParam        = searchParams.get('from');
  const toParam          = searchParams.get('to');
  const isScheduledParam = searchParams.get('isScheduled'); // 'true' | 'false' | null

  if (statusParam && !VALID_STATUSES.has(statusParam)) {
    return NextResponse.json({ error: 'BAD_REQUEST', message: `Invalid status: ${statusParam}` }, { status: 400 });
  }

  const limit  = Math.min(parseInt(limitParam  ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = parseInt(offsetParam ?? '0', 10) || 0;

  const conditions = [eq(posts.userId, userId)];

  if (statusParam)            conditions.push(eq(posts.status, statusParam as PostStatus));
  if (isScheduledParam === 'true')  conditions.push(eq(posts.isScheduled, true));
  if (isScheduledParam === 'false') conditions.push(eq(posts.isScheduled, false));
  if (fromParam)              conditions.push(gte(posts.scheduledFor, fromParam));
  if (toParam)                conditions.push(lte(posts.scheduledFor, toParam));

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db.select().from(posts).where(where).orderBy(desc(posts.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(where),
  ]);

  return NextResponse.json(
    {
      posts: rows.map((p) => ({
        postId:         p.id,
        topic:          p.topic,
        content:        p.content,
        imageUrl:       p.imageUrl,
        status:         p.status,
        isScheduled:    p.isScheduled,
        scheduledFor:   p.scheduledFor,
        createdAt:      p.createdAt,
        publishedAt:    p.publishedAt,
        linkedInPostId: p.linkedInPostId,
        errorMessage:   p.errorMessage,
      })),
      total:  Number(countResult[0]?.count ?? 0),
      limit,
      offset,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    },
  );
}
