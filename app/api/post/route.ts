import { NextRequest, NextResponse } from 'next/server';
import { publishPost, PostNotFoundError, InvalidPostStatusError, PublishFailedError } from '@/services/publish';

export async function POST(request: NextRequest) {
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

  try {
    const result = await publishPost(postId);
    return NextResponse.json({
      postId: result.postId,
      status: result.status,
      linkedInPostId: result.linkedInPostId,
      publishedAt: result.publishedAt,
    });
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json(
        { error: 'POST_NOT_FOUND', message: err.message },
        { status: 404 }
      );
    }
    if (err instanceof InvalidPostStatusError) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: err.message, currentStatus: err.currentStatus },
        { status: 409 }
      );
    }
    if (err instanceof PublishFailedError) {
      return NextResponse.json(
        { error: 'PUBLISH_FAILED', message: err.message, postId: err.postId, status: 'FAILED' },
        { status: 502 }
      );
    }
    console.error('Unexpected error in /api/post:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
