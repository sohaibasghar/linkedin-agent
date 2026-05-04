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
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  // Manual/test calls may use: x-api-key: <CRON_SECRET>
  const authHeader = request.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const apiKey = bearerToken ?? request.headers.get('x-api-key') ?? request.headers.get('X-API-Key');
  if (apiKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid API key' }, { status: 401 });
  }

  // Cron runs without a user session — use the first registered user
  const user = await db.query.users.findFirst();
  if (!user) {
    return NextResponse.json({ error: 'NO_USER', message: 'No users registered yet' }, { status: 404 });
  }

  const today = todayUTC();

  // Publish all scheduled drafts due today or earlier
  const scheduledPosts = await db.query.posts.findMany({
    where: and(
      eq(posts.userId, user.id),
      eq(posts.status, 'DRAFT'),
      eq(posts.isScheduled, true),
      lte(posts.scheduledFor, today),
    ),
  });

  if (scheduledPosts.length > 0) {
    const results = await Promise.allSettled(
      scheduledPosts.map((post) => publishPost(post.id))
    );

    const published = results.filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof publishPost>>> => r.status === 'fulfilled');
    const failed    = results.filter((r) => r.status === 'rejected');

    failed.forEach((r, i) => {
      console.error(`Failed to publish scheduled post ${scheduledPosts[i]?.id}:`, (r as PromiseRejectedResult).reason);
    });

    return NextResponse.json({
      triggered:  true,
      date:       today,
      source:     'scheduled_draft',
      published:  published.length,
      failed:     failed.length,
      postIds:    published.map((r) => r.value.postId),
    });
  }

  // No scheduled posts — generate fresh content
  try {
    const result = await generatePost({ userId: user.id, date: today });
    return NextResponse.json({ triggered: true, date: today, postId: result.postId, status: result.status, source: 'generated' });
  } catch (err) {
    console.error('Cron daily error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500 });
  }
}
