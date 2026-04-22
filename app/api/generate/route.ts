export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generatePost, GenerationFailedError } from '@/services/generate';
import { getCurrentUserId } from '@/lib/session';

export async function POST(request: NextRequest) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED', message: 'Not logged in' }, { status: 401 });
  }

  let body: { date?: string; withImage?: boolean; subject?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await generatePost({
      userId,
      date:      body.date,
      withImage: body.withImage,
      subject:   body.subject,
    });

    return NextResponse.json({
      postId:       result.postId,
      topic:        result.topic,
      content:      result.content,
      imageUrl:     result.imageUrl,
      status:       result.status,
      isScheduled:  result.isScheduled,
      scheduledFor: result.scheduledFor,
      createdAt:    result.createdAt,
    });
  } catch (err) {
    if (err instanceof GenerationFailedError) {
      return NextResponse.json({ error: 'GENERATION_FAILED', message: err.message }, { status: 500 });
    }
    console.error('Unexpected error in /api/generate:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
