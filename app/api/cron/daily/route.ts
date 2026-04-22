export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generatePost } from '@/services/generate';
import { publishPost } from '@/services/publish';
import { db } from '@/lib/db/client';
import { posts, users } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') ?? request.headers.get('X-API-Key');
  if (apiKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401 });
  }

  // Cron runs without a user session — use the first registered user
  const user = await db.query.users.findFirst();
  if (!user) {
    return NextResponse.json({ error: 'NO_USER', message: 'No users registered yet' }, { status: 404 });
  }

  const today = todayUTC();

  // Publish explicitly scheduled drafts due today
  const scheduled = await db.query.posts.findFirst({
    where: and(
      eq(posts.userId, user.id),
      eq(posts.status, 'DRAFT'),
      eq(posts.isScheduled, true),
      lte(posts.scheduledFor, today),
    ),
  });

  if (scheduled) {
    try {
      const result = await publishPost(scheduled.id);
      return NextResponse.json({ triggered: true, date: today, postId: result.postId, status: result.status, source: 'scheduled_draft' });
    } catch (err) {
      console.error('Failed to publish scheduled draft:', err);
    }
  }

  // Generate fresh content
  try {
    const result = await generatePost({ userId: user.id, date: today });
    return NextResponse.json({ triggered: true, date: today, postId: result.postId, status: result.status, source: 'generated' });
  } catch (err) {
    console.error('Cron daily error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
