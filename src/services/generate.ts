import { db } from '@/lib/db/client';
import { posts } from '@/lib/db/schema';
import { acquireLock } from '@/lib/kv/lock';
import { generateTopic } from '@/lib/ai/topic';
import { generateContent } from '@/lib/ai/content';
import type { GenerateResult } from '@/types';
import { PostStatus } from '@/types';
import { eq, and, lt } from 'drizzle-orm';

export class DuplicateDateError extends Error {
  constructor(
    public readonly date: string,
    public readonly existingPostId: string
  ) {
    super(`A post is already scheduled for ${date}`);
    this.name = 'DuplicateDateError';
  }
}

export class GenerationFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationFailedError';
  }
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export async function generatePost(date?: string): Promise<GenerateResult> {
  const targetDate = date ?? todayUTC();

  // Acquire daily lock
  const lock = await acquireLock(targetDate);
  if (!lock.acquired) {
    // Find existing post for this date
    const existing = await db.query.posts.findFirst({
      where: eq(posts.scheduledFor, targetDate),
    });
    throw new DuplicateDateError(targetDate, existing?.id ?? 'unknown');
  }

  let topic: string;
  let content: string;

  try {
    topic = await generateTopic();
    content = await generateContent(topic);
  } catch (err) {
    throw new GenerationFailedError(err instanceof Error ? err.message : String(err));
  }

  const autoPublish = process.env.AUTO_PUBLISH === 'true';
  const imageGenEnabled = process.env.IMAGE_GENERATION === 'true';

  let imageUrl: string | null = null;

  if (imageGenEnabled) {
    try {
      const { generateImage } = await import('@/lib/ai/image');
      const { uploadBlob } = await import('@/lib/storage/blob');
      const buffer = await generateImage(content);
      imageUrl = await uploadBlob(buffer, `post-${targetDate}.png`);
    } catch (err) {
      console.error('Image generation failed, continuing text-only:', err);
      imageUrl = null;
    }
  }

  const [inserted] = await db
    .insert(posts)
    .values({
      topic,
      content,
      imageUrl,
      status: 'DRAFT',
      approvalMode: !autoPublish,
      scheduledFor: targetDate,
    })
    .returning();

  const result: GenerateResult = {
    postId: inserted.id,
    topic: inserted.topic,
    content: inserted.content,
    imageUrl: inserted.imageUrl,
    status: PostStatus.DRAFT,
    scheduledFor: inserted.scheduledFor,
  };

  if (autoPublish) {
    const { publishPost } = await import('@/services/publish');
    const publishResult = await publishPost(inserted.id);
    result.status = publishResult.status;
  }

  return result;
}

export async function expireStaleDrafts(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db
    .update(posts)
    .set({
      status: 'REJECTED',
      errorMessage: 'Expired: no approval received within 7 days',
    })
    .where(
      and(
        eq(posts.status, 'DRAFT'),
        lt(posts.createdAt, sevenDaysAgo)
      )
    );
}
