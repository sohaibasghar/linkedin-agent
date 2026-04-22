export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { publishPost, PostNotFoundError, InvalidPostStatusError, PublishFailedError } from '@/services/publish';
import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/session';

export async function POST(request: NextRequest) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  let body: { postId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, { status: 400 });
  }

  const { postId } = body;
  if (!postId) {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'postId is required' }, { status: 400 });
  }

  // Verify ownership
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.userId, userId)),
  });
  if (!post) {
    return NextResponse.json({ error: 'POST_NOT_FOUND', message: `No post found with id: ${postId}` }, { status: 404 });
  }

  try {
    const result = await publishPost(postId);
    return NextResponse.json({
      postId:         result.postId,
      status:         result.status,
      linkedInPostId: result.linkedInPostId,
      publishedAt:    result.publishedAt,
    });
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: 'POST_NOT_FOUND', message: err.message }, { status: 404 });
    }
    if (err instanceof InvalidPostStatusError) {
      return NextResponse.json({ error: 'INVALID_STATUS', message: err.message, currentStatus: err.currentStatus }, { status: 409 });
    }
    if (err instanceof PublishFailedError) {
      return NextResponse.json({ error: 'PUBLISH_FAILED', message: err.message, postId: err.postId, status: 'FAILED' }, { status: 502 });
    }
    console.error('Unexpected error in /api/post:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
