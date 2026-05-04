export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, params.id), eq(posts.userId, userId)),
  });

  if (!post) {
    return NextResponse.json({ error: 'POST_NOT_FOUND', message: `No post found with id: ${params.id}` }, { status: 404 });
  }

  return NextResponse.json({
    postId:         post.id,
    topic:          post.topic,
    content:        post.content,
    imageUrl:       post.imageUrl,
    status:         post.status,
    isScheduled:    post.isScheduled,
    scheduledFor:   post.scheduledFor,
    createdAt:      post.createdAt,
    publishedAt:    post.publishedAt,
    linkedInPostId: post.linkedInPostId,
    errorMessage:   post.errorMessage,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  const { id } = params;
  let body: { scheduledFor?: string; content?: string; topic?: string; isScheduled?: boolean; status?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid JSON' }, { status: 400 });
  }

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, id), eq(posts.userId, userId)),
  });

  if (!post) {
    return NextResponse.json({ error: 'POST_NOT_FOUND', message: `No post found with id: ${id}` }, { status: 404 });
  }

  // Allow moving REJECTED/FAILED posts back to DRAFT
  const canMoveToDraft = (post.status === 'REJECTED' || post.status === 'FAILED') && body.status === 'DRAFT';
  // Block editing content/topic on scheduled posts (only allow unscheduling)
  const isScheduledPost = post.isScheduled === true;
  const isContentEdit = body.content !== undefined || body.topic !== undefined;

  if (post.status !== 'DRAFT' && !canMoveToDraft) {
    return NextResponse.json({ error: 'INVALID_STATUS', message: 'Only DRAFT posts can be edited' }, { status: 409 });
  }
  if (isScheduledPost && isContentEdit) {
    return NextResponse.json({ error: 'INVALID_STATUS', message: 'Scheduled posts cannot be edited. Cancel the schedule first.' }, { status: 409 });
  }
  if (body.content !== undefined && body.content.length > 3000) {
    return NextResponse.json({ error: 'CONTENT_TOO_LONG', message: 'Content must be ≤ 3000 characters' }, { status: 422 });
  }

  const updates: Partial<{
    scheduledFor: string;
    content: string;
    topic: string;
    isScheduled: boolean;
    status: 'DRAFT';
    errorMessage: null;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (canMoveToDraft) {
    updates.status = 'DRAFT';
    updates.isScheduled = false;
    updates.errorMessage = null;
  }
  if (body.scheduledFor !== undefined) updates.scheduledFor = body.scheduledFor;
  if (body.content      !== undefined) updates.content      = body.content;
  if (body.topic        !== undefined) updates.topic        = body.topic;
  if (body.isScheduled  !== undefined) updates.isScheduled  = body.isScheduled;

  const [updated] = await db
    .update(posts)
    .set(updates)
    .where(and(eq(posts.id, id), eq(posts.userId, userId)))
    .returning();

  return NextResponse.json({
    postId:       updated.id,
    topic:        updated.topic,
    content:      updated.content,
    scheduledFor: updated.scheduledFor,
    isScheduled:  updated.isScheduled,
    status:       updated.status,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  const { id } = params;

  const post = await db.query.posts.findFirst({ where: and(eq(posts.id, id), eq(posts.userId, userId)) });
  if (!post) {
    return NextResponse.json({ error: 'POST_NOT_FOUND', message: `No post found with id: ${id}` }, { status: 404 });
  }

  if (post.status !== 'DRAFT') {
    return NextResponse.json({ error: 'INVALID_STATUS', message: 'Only DRAFT posts can be deleted' }, { status: 409 });
  }

  await db.delete(posts).where(and(eq(posts.id, id), eq(posts.userId, userId)));

  return NextResponse.json({ success: true });
}
