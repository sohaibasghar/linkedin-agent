import { NextRequest, NextResponse } from 'next/server';
import { generatePost, DuplicateDateError } from '@/services/generate';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') ?? request.headers.get('X-API-Key');
  if (apiKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await generatePost(today);
    return NextResponse.json({
      triggered: true,
      date: today,
      postId: result.postId,
      status: result.status,
    });
  } catch (err) {
    if (err instanceof DuplicateDateError) {
      return NextResponse.json({
        triggered: false,
        reason: 'DUPLICATE_DATE',
        existingPostId: err.existingPostId,
      }, { status: 409 });
    }

    console.error('Cron daily error:', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
