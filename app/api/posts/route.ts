import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type { PostStatus } from '@/types';

const VALID_STATUSES = new Set(['DRAFT', 'APPROVED', 'PUBLISHED', 'FAILED', 'REJECTED']);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const statusParam = searchParams.get('status');
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  if (statusParam && !VALID_STATUSES.has(statusParam)) {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: `Invalid status: ${statusParam}` },
      { status: 400 }
    );
  }

  const limit = Math.min(parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = parseInt(offsetParam ?? '0', 10) || 0;

  const conditions = [];

  if (statusParam) {
    conditions.push(eq(posts.status, statusParam as PostStatus));
  }
  if (fromParam) {
    conditions.push(gte(posts.scheduledFor, fromParam));
  }
  if (toParam) {
    conditions.push(lte(posts.scheduledFor, toParam));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(whereClause)
      .orderBy(desc(posts.scheduledFor))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return NextResponse.json({
    posts: rows.map((p) => ({
      postId: p.id,
      topic: p.topic,
      content: p.content,
      imageUrl: p.imageUrl,
      status: p.status,
      scheduledFor: p.scheduledFor,
      createdAt: p.createdAt,
      publishedAt: p.publishedAt,
      linkedInPostId: p.linkedInPostId,
      errorMessage: p.errorMessage,
    })),
    total,
    limit,
    offset,
  });
}
